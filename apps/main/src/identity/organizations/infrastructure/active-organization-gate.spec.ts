import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import type { Db } from "mongodb";
import { type Connection, Types } from "mongoose";
import { generateMongoConfig } from "../../../database/config";
import { findActiveOrganizationIdForUser } from "./active-organization-gate";
import { Member as MemberSchemaClass, MemberSchema } from "./schemas/member.schema";

const MEMBER_COLLECTION = "member";

describe("active-organization-gate", () => {
  let module: TestingModule;
  let connection: Connection;
  let db: Db;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([{ name: MemberSchemaClass.name, schema: MemberSchema }]),
      ],
    }).compile();

    connection = module.get(getConnectionToken());
    const rawDb = connection.db;
    if (!rawDb) {
      throw new Error("Database connection not established");
    }
    db = rawDb;
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await db.collection(MEMBER_COLLECTION).deleteMany({});
  });

  const seedMember = async (overrides: Partial<Record<string, unknown>> = {}) => {
    const row: Record<string, unknown> = {
      _id: new Types.ObjectId(),
      userId: "user-1",
      organizationId: new Types.ObjectId(),
      role: "owner",
      createdAt: new Date("2026-05-02T10:00:00Z"),
      _schemaVersion: "1.0.0",
      ...overrides,
    };
    await db.collection(MEMBER_COLLECTION).insertOne(row);
    return row;
  };

  it("returns the membership's organizationId as a string", async () => {
    const orgId = new Types.ObjectId();
    await seedMember({ userId: "user-1", organizationId: orgId });

    expect(await findActiveOrganizationIdForUser(db, "user-1")).toBe(orgId.toString());
  });

  it("returns undefined when the user has no membership", async () => {
    await seedMember({ userId: "someone-else" });

    expect(await findActiveOrganizationIdForUser(db, "user-1")).toBeUndefined();
  });

  it("picks the earliest membership by createdAt", async () => {
    const earliestOrg = new Types.ObjectId();
    await seedMember({
      userId: "user-1",
      organizationId: new Types.ObjectId(),
      createdAt: new Date("2026-05-10T00:00:00Z"),
    });
    await seedMember({
      userId: "user-1",
      organizationId: earliestOrg,
      createdAt: new Date("2026-05-01T00:00:00Z"),
    });

    expect(await findActiveOrganizationIdForUser(db, "user-1")).toBe(earliestOrg.toString());
  });

  it("scopes the lookup to the given userId", async () => {
    const orgTwo = new Types.ObjectId();
    await seedMember({ userId: "user-1", organizationId: new Types.ObjectId() });
    await seedMember({ userId: "user-2", organizationId: orgTwo });

    expect(await findActiveOrganizationIdForUser(db, "user-2")).toBe(orgTwo.toString());
  });

  it("matches a userId stored as an ObjectId", async () => {
    const userId = new Types.ObjectId();
    const orgId = new Types.ObjectId();
    await seedMember({ userId, organizationId: orgId });

    expect(await findActiveOrganizationIdForUser(db, userId.toString())).toBe(orgId.toString());
  });

  it("does not treat an operator-shaped userId as a query operator", async () => {
    await seedMember({ userId: "user-1" });

    const malicious = { $ne: null } as unknown as string;
    expect(await findActiveOrganizationIdForUser(db, malicious)).toBeUndefined();
  });
});
