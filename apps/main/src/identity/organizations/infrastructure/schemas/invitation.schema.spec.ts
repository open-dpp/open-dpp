import { expect } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connect, Connection, Model } from "mongoose";
import { InvitationStatus } from "../../domain/invitation-status.enum";
import { MemberRole } from "../../domain/member-role.enum";
import { Invitation, InvitationSchema } from "./invitation.schema";

describe("invitationSchema", () => {
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let InvitationModel: Model<Invitation>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    InvitationModel = mongoConnection.model(Invitation.name, InvitationSchema);
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();
  });

  it("should create an invitation document", async () => {
    const invitationData = {
      _id: "invitation-123",
      email: "test@example.com",
      inviterId: "user-123",
      organizationId: "org-123",
      role: MemberRole.ADMIN,
      status: InvitationStatus.PENDING,
      createdAt: new Date(),
      expiresAt: new Date(),
    };

    const invitation = new InvitationModel(invitationData);
    const savedInvitation = await invitation.save();

    expect(savedInvitation._id).toBe(invitationData._id);
    expect(savedInvitation.email).toBe(invitationData.email);
    expect(savedInvitation.role).toBe(invitationData.role);
  });

  it("should validate required fields", async () => {
    const invitation = new InvitationModel({});

    let err: any;
    try {
      await invitation.save();
    }
    catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.inviterId).toBeDefined();
    expect(err.errors.organizationId).toBeDefined();
    expect(err.errors.role).toBeDefined();
  });

  it("should fail if role is invalid", async () => {
    const invitationData = {
      _id: "invitation-invalid-role",
      email: "test@example.com",
      inviterId: "user-123",
      organizationId: "org-123",
      role: "INVALID_ROLE",
      status: InvitationStatus.PENDING,
      createdAt: new Date(),
      expiresAt: new Date(),
    };

    const invitation = new InvitationModel(invitationData);
    let err: any;
    try {
      await invitation.save();
    }
    catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.role).toBeDefined();
  });
});
