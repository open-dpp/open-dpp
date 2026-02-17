import { expect } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connect, Connection, Model } from "mongoose";
import { Session, SessionSchema } from "./session.schema";

describe("sessionSchema", () => {
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let SessionModel: Model<Session>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    SessionModel = mongoConnection.model(Session.name, SessionSchema);
    await SessionModel.createIndexes();
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      await collections[key].drop();
    }
    await mongoConnection.close();
    await mongod.stop();
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
