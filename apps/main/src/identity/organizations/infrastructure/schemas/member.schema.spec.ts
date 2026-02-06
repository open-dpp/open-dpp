import { expect } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connect, Connection, Model, Types } from "mongoose";
import { MemberRole } from "../../domain/member-role.enum";
import { Member, MemberSchema } from "./member.schema";

describe("memberSchema", () => {
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let MemberModel: Model<Member>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    MemberModel = mongoConnection.model(Member.name, MemberSchema);
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

  it("should create a member document", async () => {
    const memberData = {
      _id: "member-123",
      userId: new Types.ObjectId(),
      organizationId: new Types.ObjectId(),
      role: MemberRole.ADMIN,
      createdAt: new Date(),
    };

    const member = new MemberModel(memberData);
    const savedMember = await member.save();

    expect(savedMember._id).toBe(memberData._id);
    expect(savedMember.userId).toEqual(memberData.userId);
    expect(savedMember.organizationId).toEqual(memberData.organizationId);
    expect(savedMember.role).toBe(memberData.role);
  });

  it("should create a member document with string userId", async () => {
    const memberData = {
      _id: "member-456",
      userId: "string-user-id", // String ID
      organizationId: new Types.ObjectId(),
      role: MemberRole.MEMBER,
      createdAt: new Date(),
    };

    const member = new MemberModel(memberData);
    const savedMember = await member.save();

    expect(savedMember._id).toBe(memberData._id);
    expect(savedMember.userId).toBe(memberData.userId);
    expect(typeof savedMember.userId).toBe("string");
    expect(savedMember.organizationId).toEqual(memberData.organizationId);
    expect(savedMember.role).toBe(memberData.role);
  });

  it("should validate required fields", async () => {
    const member = new MemberModel({});

    let err: any;
    try {
      await member.save();
    }
    catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.userId).toBeDefined();
    expect(err.errors.organizationId).toBeDefined();
    expect(err.errors.role).toBeDefined();
  });
});
