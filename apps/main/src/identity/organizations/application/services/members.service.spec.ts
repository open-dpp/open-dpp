import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ValueError } from "@open-dpp/exception";
import { UserRole } from "../../../users/domain/user-role.enum";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { Member } from "../../domain/member";
import { MemberRole } from "../../domain/member-role.enum";
import { MembersRepository } from "../../infrastructure/adapters/members.repository";
import { OrganizationsRepository } from "../../infrastructure/adapters/organizations.repository";
import { SessionsRepository } from "../../../auth/infrastructure/adapters/sessions.repository";
import { MembersService } from "./members.service";

describe("MembersService", () => {
  let service: MembersService;
  let mockMembersRepo: any;
  let mockOrganizationsRepo: any;
  let mockUsersRepo: any;
  let mockSessionsRepo: any;

  beforeEach(async () => {
    mockMembersRepo = {
      findOneByUserIdAndOrganizationId: jest.fn(),
      findByOrganizationId: jest.fn(),
      findOneByIdOrFail: jest.fn(),
      deleteById: jest.fn(),
    };
    mockOrganizationsRepo = {
      findManyByMember: jest.fn(),
    };
    mockUsersRepo = {
      findOneOrFail: jest.fn(),
      findOneById: jest.fn(),
      findAllByIds: jest.fn(),
    };
    mockSessionsRepo = {
      clearActiveOrganization: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: MembersRepository, useValue: mockMembersRepo },
        { provide: OrganizationsRepository, useValue: mockOrganizationsRepo },
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: SessionsRepository, useValue: mockSessionsRepo },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  it("should check if user is member of organization", async () => {
    mockMembersRepo.findOneByUserIdAndOrganizationId.mockResolvedValue({ id: "1" });
    expect(await service.isMemberOfOrganization("user-1", "org-1")).toBe(true);
    expect(mockMembersRepo.findOneByUserIdAndOrganizationId).toHaveBeenCalledWith(
      "user-1",
      "org-1",
    );

    mockMembersRepo.findOneByUserIdAndOrganizationId.mockResolvedValue(null);
    expect(await service.isMemberOfOrganization("user-1", "org-1")).toBe(false);
  });

  it("should check if user is owner or admin", async () => {
    // Owner logic
    const ownerMember = Member.create({
      organizationId: "org-1",
      userId: "user-1",
      role: MemberRole.OWNER,
    });
    mockMembersRepo.findOneByUserIdAndOrganizationId.mockResolvedValue(ownerMember);
    expect(await service.isOwnerOrAdmin("org-1", "user-1")).toBe(true);

    // Admin user logic
    const regularMember = Member.create({
      organizationId: "org-1",
      userId: "user-1",
      role: MemberRole.MEMBER,
    });
    mockMembersRepo.findOneByUserIdAndOrganizationId.mockResolvedValue(regularMember);
    mockUsersRepo.findOneById.mockResolvedValue({ role: UserRole.ADMIN });
    expect(await service.isOwnerOrAdmin("org-1", "user-1")).toBe(true);

    // Not owner not admin
    mockMembersRepo.findOneByUserIdAndOrganizationId.mockResolvedValue(regularMember);
    mockUsersRepo.findOneById.mockResolvedValue({ role: UserRole.USER });
    expect(await service.isOwnerOrAdmin("org-1", "user-1")).toBe(false);

    // Not member
    mockMembersRepo.findOneByUserIdAndOrganizationId.mockResolvedValue(null);
    expect(await service.isOwnerOrAdmin("org-1", "user-1")).toBe(false);
  });

  it("should get members with user info", async () => {
    mockMembersRepo.findByOrganizationId.mockResolvedValue([
      Member.create({ userId: "user-1", role: MemberRole.MEMBER, organizationId: "org-1" }),
    ]);
    mockUsersRepo.findAllByIds.mockResolvedValue([
      { id: "user-1", email: "test@example.com", name: "Test", image: "img.png" },
    ]);

    const result = await service.getMembers("org-1");

    expect(result).toHaveLength(1);
    expect(result[0].user).toEqual({
      id: "user-1",
      email: "test@example.com",
      name: "Test",
      image: "img.png",
    });
  });

  describe("removeMember", () => {
    it("should remove member and clear their active organization", async () => {
      const member = Member.create({
        organizationId: "org-1",
        userId: "user-1",
        role: MemberRole.MEMBER,
      });
      mockMembersRepo.findOneByIdOrFail.mockResolvedValue(member);

      await service.removeMember("org-1", member.id, "actor-user");

      expect(mockMembersRepo.findOneByIdOrFail).toHaveBeenCalledWith(member.id);
      expect(mockSessionsRepo.clearActiveOrganization).toHaveBeenCalledWith("user-1", "org-1");
      expect(mockMembersRepo.deleteById).toHaveBeenCalledWith(member.id);
    });

    it("should throw ForbiddenException if member belongs to another organization", async () => {
      const member = Member.create({
        organizationId: "org-2",
        userId: "user-1",
        role: MemberRole.MEMBER,
      });
      mockMembersRepo.findOneByIdOrFail.mockResolvedValue(member);

      await expect(service.removeMember("org-1", member.id, "actor-user")).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockSessionsRepo.clearActiveOrganization).not.toHaveBeenCalled();
      expect(mockMembersRepo.deleteById).not.toHaveBeenCalled();
    });

    it("should throw ValueError when removing own membership", async () => {
      const member = Member.create({
        organizationId: "org-1",
        userId: "user-1",
        role: MemberRole.MEMBER,
      });
      mockMembersRepo.findOneByIdOrFail.mockResolvedValue(member);

      await expect(service.removeMember("org-1", member.id, "user-1")).rejects.toThrow(
        ValueError,
      );
      expect(mockSessionsRepo.clearActiveOrganization).not.toHaveBeenCalled();
      expect(mockMembersRepo.deleteById).not.toHaveBeenCalled();
    });

    it("should throw ValueError when removing an owner", async () => {
      const member = Member.create({
        organizationId: "org-1",
        userId: "user-1",
        role: MemberRole.OWNER,
      });
      mockMembersRepo.findOneByIdOrFail.mockResolvedValue(member);

      await expect(service.removeMember("org-1", member.id, "actor-user")).rejects.toThrow(
        ValueError,
      );
      expect(mockSessionsRepo.clearActiveOrganization).not.toHaveBeenCalled();
      expect(mockMembersRepo.deleteById).not.toHaveBeenCalled();
    });
  });
});
