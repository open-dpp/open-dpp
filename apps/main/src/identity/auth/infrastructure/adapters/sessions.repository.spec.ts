import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Connection, Types } from "mongoose";
import { generateMongoConfig } from "../../../../database/config";
import { SESSION_COLLECTION } from "../schemas/session.schema";
import { SessionsRepository } from "./sessions.repository";

interface SessionDoc {
  _id: string;
  userId: string | Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  activeOrganizationId: string | null;
}

describe("SessionsRepository", () => {
  let repository: SessionsRepository;
  let connection: Connection;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
      ],
      providers: [SessionsRepository],
    }).compile();

    repository = module.get<SessionsRepository>(SessionsRepository);
    connection = module.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await module.close();
  });

  function sessionCollection() {
    const db = connection.db;
    if (!db) {
      throw new Error("Test connection has no database handle");
    }
    return db.collection<SessionDoc>(SESSION_COLLECTION);
  }

  // Mirrors the document shape better-auth writes: string _id, userId as string or ObjectId.
  async function insertSession(
    overrides: Partial<SessionDoc> & Pick<SessionDoc, "userId">,
  ): Promise<string> {
    const now = new Date();
    const doc: SessionDoc = {
      _id: randomUUID(),
      token: randomUUID(),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
      activeOrganizationId: null,
      ...overrides,
    };
    await sessionCollection().insertOne(doc);
    return doc._id;
  }

  async function findSession(id: string): Promise<SessionDoc | null> {
    return sessionCollection().findOne({ _id: id });
  }

  it("clears activeOrganizationId for sessions matching user and organization", async () => {
    const userId = randomUUID();
    const organizationId = new Types.ObjectId().toHexString();
    const sessionId = await insertSession({ userId, activeOrganizationId: organizationId });

    await repository.clearActiveOrganization(userId, organizationId);

    const session = await findSession(sessionId);
    expect(session?.activeOrganizationId).toBeNull();
  });

  it("clears sessions whose userId is stored as an ObjectId when called with its hex string", async () => {
    const userIdHex = new Types.ObjectId().toHexString();
    const organizationId = new Types.ObjectId().toHexString();
    const sessionId = await insertSession({
      userId: new Types.ObjectId(userIdHex),
      activeOrganizationId: organizationId,
    });

    await repository.clearActiveOrganization(userIdHex, organizationId);

    const session = await findSession(sessionId);
    expect(session?.activeOrganizationId).toBeNull();
  });

  it("leaves sessions of other users and other organizations untouched", async () => {
    const userId = randomUUID();
    const otherUserId = randomUUID();
    const organizationId = new Types.ObjectId().toHexString();
    const otherOrganizationId = new Types.ObjectId().toHexString();
    const sameUserOtherOrg = await insertSession({
      userId,
      activeOrganizationId: otherOrganizationId,
    });
    const otherUserSameOrg = await insertSession({
      userId: otherUserId,
      activeOrganizationId: organizationId,
    });

    await repository.clearActiveOrganization(userId, organizationId);

    expect((await findSession(sameUserOtherOrg))?.activeOrganizationId).toBe(otherOrganizationId);
    expect((await findSession(otherUserSameOrg))?.activeOrganizationId).toBe(organizationId);
  });

  it("does not clear any session for an operator-shaped organizationId", async () => {
    const userId = randomUUID();
    const organizationId = new Types.ObjectId().toHexString();
    const sessionId = await insertSession({ userId, activeOrganizationId: organizationId });

    const malicious = { $ne: null } as unknown as string;
    await repository.clearActiveOrganization(userId, malicious);

    const session = await findSession(sessionId);
    expect(session?.activeOrganizationId).toBe(organizationId);
  });

  it("leaves sessions without an activeOrganizationId field untouched", async () => {
    // better-auth omits the field entirely until the user activates an organization.
    const userId = randomUUID();
    const organizationId = new Types.ObjectId().toHexString();
    const sessionId = await insertSession({ userId });
    await sessionCollection().updateOne(
      { _id: sessionId },
      { $unset: { activeOrganizationId: "" } },
    );

    await repository.clearActiveOrganization(userId, organizationId);

    const session = await findSession(sessionId);
    expect(session).not.toBeNull();
    expect(session?.activeOrganizationId).toBeUndefined();
  });
});
