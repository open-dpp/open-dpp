import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { Types } from "mongoose";
import { Member } from "../../domain/member";
import { MemberRole } from "../../domain/member-role.enum";
import { Member as MemberSchema } from "../schemas/member.schema";
import { MembersRepository } from "./members.repository";

describe("MembersRepository", () => {
  let repository: MembersRepository;
  let mockMemberModel: any;

  beforeEach(async () => {
    mockMemberModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersRepository,
        {
          provide: getModelToken(MemberSchema.name),
          useValue: mockMemberModel,
        },
      ],
    }).compile();

    repository = module.get<MembersRepository>(MembersRepository);
  });

  it("should find one by id", async () => {
    const doc = {
      _id: "member-1",
      organizationId: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      role: "admin",
      createdAt: new Date(),
    };
    mockMemberModel.findById.mockResolvedValue(doc);

    const result = await repository.findOneById("member-1");

    expect(result).toBeInstanceOf(Member);
    expect(result?.id).toBe("member-1");
  });

  it("should find by user id", async () => {
    const userId = new Types.ObjectId();
    const doc = {
      _id: "member-1",
      organizationId: new Types.ObjectId(),
      userId,
      role: "admin",
      createdAt: new Date(),
    };
    mockMemberModel.find.mockResolvedValue([doc]);

    const result = await repository.findByUserId(userId.toHexString());

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(userId.toHexString());
    expect(mockMemberModel.find).toHaveBeenCalledWith(expect.objectContaining({
      userId,
    }));
  });

  it("should find one by user id and organization id", async () => {
    const userId = new Types.ObjectId();
    const orgId = new Types.ObjectId();
    const doc = {
      _id: "member-1",
      organizationId: orgId,
      userId,
      role: "admin",
      createdAt: new Date(),
    };
    mockMemberModel.findOne.mockResolvedValue(doc);

    const result = await repository.findOneByUserIdAndOrganizationId(userId.toHexString(), orgId.toHexString());

    expect(result).toBeInstanceOf(Member);
    expect(mockMemberModel.findOne).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      organizationId: orgId,
    }));
  });

  it("should save member", async () => {
    const organizationId = new Types.ObjectId().toHexString();
    const userId = new Types.ObjectId().toHexString();
    const member = Member.create({
      organizationId,
      userId,
      role: MemberRole.MEMBER,
    });

    await repository.save(member);

    expect(mockMemberModel.findByIdAndUpdate).toHaveBeenCalledWith(
      member.id,
      expect.any(Object),
      { upsert: true },
    );
  });
});
