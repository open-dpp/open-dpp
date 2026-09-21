import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Session } from "../../../auth/domain/session";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { Member } from "../../domain/member";
import { MemberRole } from "../../domain/member-role.enum";
import { Organization } from "../../domain/organization";
import { InvitationsRepository } from "../../infrastructure/adapters/invitations.repository";
import { MembersRepository } from "../../infrastructure/adapters/members.repository";
import { OrganizationsRepository } from "../../infrastructure/adapters/organizations.repository";
import { OrganizationsService } from "./organizations.service";
import { InstanceSettingsService } from "../../../../instance-settings/application/services/instance-settings.service";
import { UserRole } from "../../../users/domain/user-role.enum";
import { InstanceSettings } from "../../../../instance-settings/domain/instance-settings";
import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";
import { PolicyManagementService } from "../../../../policy/application/services/policy-management.service";

describe("OrganizationsService", () => {
  let service: OrganizationsService;

  const mockOrganizationsRepository = {
    create:
      jest.fn<
        (organization: Organization, headers: BetterAuthHeaders) => Promise<Organization | null>
      >(),
    findOneById: jest.fn(),
    findManyByIds: jest.fn<(ids: string[]) => Promise<Organization[]>>(),
    update: jest.fn(),
  };

  const mockMembersRepository = {
    findOneByUserIdAndOrganizationId: jest.fn(),
    findByUserId: jest.fn<(userId: string) => Promise<Member[]>>(),
  };

  const mockUsersRepository = {
    findOneById: jest.fn(),
  };

  const mockInstanceSettingsService = {
    getSettings: jest.fn<() => Promise<InstanceSettings>>(),
  };

  const mockInvitationsRepository = {};

  const mockPolicyService = {
    ensureDefaultPolicies: jest.fn<(organizationId: string) => Promise<void>>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: OrganizationsRepository,
          useValue: mockOrganizationsRepository,
        },
        {
          provide: MembersRepository,
          useValue: mockMembersRepository,
        },
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: InvitationsRepository,
          useValue: mockInvitationsRepository,
        },
        {
          provide: InstanceSettingsService,
          useValue: mockInstanceSettingsService,
        },
        {
          provide: PolicyManagementService,
          useValue: mockPolicyService,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  describe("getMemberOrganizations", () => {
    it("lists the organizations the user is a member of, from the memberships alone", async () => {
      const memberships = [
        Member.create({ userId: "user1", organizationId: "org-1", role: MemberRole.OWNER }),
        Member.create({ userId: "user1", organizationId: "org-2", role: MemberRole.MEMBER }),
      ];
      const organizations = [
        Organization.create({ name: "One", metadata: {} }),
        Organization.create({ name: "Two", metadata: {} }),
      ];
      mockMembersRepository.findByUserId.mockResolvedValue(memberships);
      mockOrganizationsRepository.findManyByIds.mockResolvedValue(organizations);

      const result = await service.getMemberOrganizations("user1");

      expect(result).toBe(organizations);
      expect(mockMembersRepository.findByUserId).toHaveBeenCalledWith("user1");
      expect(mockOrganizationsRepository.findManyByIds).toHaveBeenCalledWith(["org-1", "org-2"]);
    });

    it("answers an empty list without querying organizations for a user without memberships", async () => {
      mockMembersRepository.findByUserId.mockResolvedValue([]);
      mockOrganizationsRepository.findManyByIds.mockClear();

      const result = await service.getMemberOrganizations("user1");

      expect(result).toEqual([]);
      expect(mockOrganizationsRepository.findManyByIds).not.toHaveBeenCalled();
    });
  });

  it("should create organization ", async () => {
    mockInstanceSettingsService.getSettings.mockResolvedValue(
      InstanceSettings.create({ organizationCreationEnabled: { value: false } }),
    );
    const session = { userId: "user1" } as Session;
    const headers = {};
    const organization = Organization.create({
      name: "Test Organization",
      metadata: {},
    });
    mockOrganizationsRepository.create.mockResolvedValue(organization);

    const userRole = UserRole.USER;
    await expect(
      service.createOrganization(organization, session, headers, userRole),
    ).rejects.toThrow(
      new ForbiddenException("Organization creation is not enabled for this instance."),
    );

    await service.createOrganization(organization, session, headers, UserRole.ADMIN);
    expect(mockOrganizationsRepository.create).toHaveBeenCalled();

    mockInstanceSettingsService.getSettings.mockResolvedValue(
      InstanceSettings.create({ organizationCreationEnabled: { value: true } }),
    );
    await service.createOrganization(organization, session, headers, userRole);

    expect(mockOrganizationsRepository.create).toHaveBeenCalledTimes(2);
  });

  it("should seed the default policies for a newly created organization", async () => {
    mockInstanceSettingsService.getSettings.mockResolvedValue(
      InstanceSettings.create({ organizationCreationEnabled: { value: true } }),
    );
    const created = Organization.create({
      name: "Test Organization",
      metadata: {},
    });
    mockOrganizationsRepository.create.mockResolvedValue(created);

    await service.createOrganization(
      { name: created.name, metadata: {} },
      { userId: "user1" } as Session,
      {},
      UserRole.USER,
    );

    expect(mockPolicyService.ensureDefaultPolicies).toHaveBeenCalledWith(created.id);
  });
});
