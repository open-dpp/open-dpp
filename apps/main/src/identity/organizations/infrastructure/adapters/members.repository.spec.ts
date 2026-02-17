import { describe, expect, it } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Types } from "mongoose";
import { generateMongoConfig } from "../../../../database/config";
import { Member } from "../../domain/member";
import { MemberRole } from "../../domain/member-role.enum";
import { Member as MemberSchema, MemberSchema as MemberSchemaDefinition } from "../schemas/member.schema";
import { MembersRepository } from "./members.repository";

describe("MembersRepository", () => {
  let repository: MembersRepository;
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
          {
            name: MemberSchema.name,
            schema: MemberSchemaDefinition,
          },
        ]),
      ],
      providers: [MembersRepository],
    }).compile();

    repository = module.get<MembersRepository>(MembersRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  it("should save and return the saved member", async () => {
    const member = Member.create({
      organizationId: new Types.ObjectId().toHexString(),
      userId: new Types.ObjectId().toHexString(),
      role: MemberRole.ADMIN,
    });

    const savedMember = await repository.save(member);

    expect(savedMember).toBeInstanceOf(Member);
    expect(savedMember.id).toBe(member.id);
    expect(savedMember.organizationId).toBe(member.organizationId);
    expect(savedMember.userId).toBe(member.userId);
    expect(savedMember.role).toBe(MemberRole.ADMIN);
  });

  it("should find a member by id", async () => {
    const member = Member.create({
      organizationId: new Types.ObjectId().toHexString(),
      userId: new Types.ObjectId().toHexString(),
      role: MemberRole.ADMIN,
    });

    await repository.save(member);

    const result = await repository.findOneById(member.id);

    expect(result).toBeInstanceOf(Member);
    expect(result?.id).toBe(member.id);
  });

  it("should return null when member is not found by id", async () => {
    const result = await repository.findOneById("non-existent-id");

    expect(result).toBeNull();
  });

  it("should find members by user id", async () => {
    const userId = new Types.ObjectId().toHexString();
    const member1 = Member.create({
      organizationId: new Types.ObjectId().toHexString(),
      userId,
      role: MemberRole.MEMBER,
    });
    const member2 = Member.create({
      organizationId: new Types.ObjectId().toHexString(),
      userId,
      role: MemberRole.ADMIN,
    });
    const otherMember = Member.create({
      organizationId: new Types.ObjectId().toHexString(),
      userId: new Types.ObjectId().toHexString(),
      role: MemberRole.MEMBER,
    });

    await repository.save(member1);
    await repository.save(member2);
    await repository.save(otherMember);

    const result = await repository.findByUserId(userId);

    expect(result).toHaveLength(2);
    expect(result.every(m => m.userId === userId)).toBe(true);
  });

  it("should find members by organization id", async () => {
    const organizationId = new Types.ObjectId().toHexString();
    const member1 = Member.create({
      organizationId,
      userId: new Types.ObjectId().toHexString(),
      role: MemberRole.MEMBER,
    });
    const member2 = Member.create({
      organizationId,
      userId: new Types.ObjectId().toHexString(),
      role: MemberRole.ADMIN,
    });
    const otherMember = Member.create({
      organizationId: new Types.ObjectId().toHexString(),
      userId: new Types.ObjectId().toHexString(),
      role: MemberRole.MEMBER,
    });

    await repository.save(member1);
    await repository.save(member2);
    await repository.save(otherMember);

    const result = await repository.findByOrganizationId(organizationId);

    expect(result).toHaveLength(2);
    expect(result.every(m => m.organizationId === organizationId)).toBe(true);
  });

  it("should find one member by user id and organization id", async () => {
    const userId = new Types.ObjectId().toHexString();
    const organizationId = new Types.ObjectId().toHexString();
    const member = Member.create({
      organizationId,
      userId,
      role: MemberRole.OWNER,
    });

    await repository.save(member);

    const result = await repository.findOneByUserIdAndOrganizationId(userId, organizationId);

    expect(result).toBeInstanceOf(Member);
    expect(result?.userId).toBe(userId);
    expect(result?.organizationId).toBe(organizationId);
    expect(result?.role).toBe(MemberRole.OWNER);
  });

  it("should return null when member is not found by user id and organization id", async () => {
    const result = await repository.findOneByUserIdAndOrganizationId(
      new Types.ObjectId().toHexString(),
      new Types.ObjectId().toHexString(),
    );

    expect(result).toBeNull();
  });

  it("should update an existing member on save and return the updated member", async () => {
    const organizationId = new Types.ObjectId().toHexString();
    const userId = new Types.ObjectId().toHexString();
    const member = Member.create({
      organizationId,
      userId,
      role: MemberRole.MEMBER,
    });

    await repository.save(member);

    const updatedMember = Member.loadFromDb({
      id: member.id,
      organizationId,
      userId,
      role: MemberRole.ADMIN,
      createdAt: member.createdAt,
    });

    const result = await repository.save(updatedMember);

    expect(result).toBeInstanceOf(Member);
    expect(result.role).toBe(MemberRole.ADMIN);
  });
});
