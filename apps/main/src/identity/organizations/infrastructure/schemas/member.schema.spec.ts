import type { Connection, Model } from "mongoose";
import { expect } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { Types } from "mongoose";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../../../database/config";
import { MemberRole } from "../../domain/member-role.enum";
import { Member, MemberSchema } from "./member.schema";

describe("memberSchema", () => {
  let mongoConnection: Connection;
  let MemberModel: Model<Member>;
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
          { name: Member.name, schema: MemberSchema },
        ]),
      ],
    }).compile();
    mongoConnection = module.get<Connection>(getConnectionToken());
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
    await module.close();
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

    await expect(member.save()).rejects.toMatchObject({
      errors: expect.objectContaining({
        userId: expect.anything(),
        organizationId: expect.anything(),
        role: expect.anything(),
      }),
    });
  });
});
