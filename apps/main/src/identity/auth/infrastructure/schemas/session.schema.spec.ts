import type { Connection, Model } from "mongoose";
import { expect } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../../../database/config";
import { Session, SessionSchema } from "./session.schema";

describe("sessionSchema", () => {
  let SessionModel: Model<Session>;
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
        MongooseModule.forFeature([
          { name: Session.name, schema: SessionSchema },
        ]),
      ],
    }).compile();
    const connection = module.get<Connection>(getConnectionToken());
    SessionModel = connection.model(Session.name, SessionSchema);

    await SessionModel.createIndexes();
  });

  afterAll(async () => {
    await module.close();
  });

  it("should create a session document", async () => {
    const sessionData = {
      _id: "session-123",
      userId: "user-123",
      token: "unique-token",
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: "127.0.0.1",
      userAgent: "TestAgent",
      activeOrganizationId: "org-123",
      activeTeamId: "team-123",
    };

    const session = new SessionModel(sessionData);
    const savedSession = await session.save();

    expect(savedSession._id).toBe(sessionData._id);
    expect(savedSession.userId).toBe(sessionData.userId);
    expect(savedSession.token).toBe(sessionData.token);
    expect(savedSession.activeOrganizationId).toBe(sessionData.activeOrganizationId);
  });

  it("should validate required fields", async () => {
    const session = new SessionModel({});

    await expect(session.save()).rejects.toMatchObject({
      errors: {
        userId: expect.anything(),
        token: expect.anything(),
        expiresAt: expect.anything(),
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      },
    });
  });

  it("should enforce unique token constraint", async () => {
    const sessionData = {
      _id: "session-1",
      userId: "user-1",
      token: "duplicate-token",
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await new SessionModel(sessionData).save();

    const duplicateSessionData = {
      _id: "session-2",
      userId: "user-2",
      token: "duplicate-token",
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await expect(
      new SessionModel(duplicateSessionData).save(),
    ).rejects.toMatchObject({
      code: 11000,
    });
  });
});
