import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Session } from "../../../auth/domain/session";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { Organization } from "../../domain/organization";
import { InvitationsRepository } from "../../infrastructure/adapters/invitations.repository";
import { MembersRepository } from "../../infrastructure/adapters/members.repository";
import { OrganizationsRepository } from "../../infrastructure/adapters/organizations.repository";
import { OrganizationsService } from "./organizations.service";
import { InstanceSettingsService } from "../../../../instance-settings/application/services/instance-settings.service";
import { UserRole } from "../../../users/domain/user-role.enum";
import { InstanceSettings } from "../../../../instance-settings/domain/instance-settings";
import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";

describe("OrganizationsService", () => {
  let service: OrganizationsService;

  const mockOrganizationsRepository = {
    findOneBySlug: jest.fn<(slug: string) => Promise<Organization | null>>(),
    create:
      jest.fn<
        (organization: Organization, headers: BetterAuthHeaders) => Promise<Organization | null>
      >(),
    findOneById: jest.fn(),
    update: jest.fn(),
  };

  const mockMembersRepository = {
    findOneByUserIdAndOrganizationId: jest.fn(),
  };

  const mockUsersRepository = {
    findOneById: jest.fn(),
  };

  const mockInstanceSettingsService = {
    getSettings: jest.fn<() => Promise<InstanceSettings>>(),
  };

  const mockInvitationsRepository = {};

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
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  it("should create organization ", async () => {
    mockInstanceSettingsService.getSettings.mockResolvedValue(
      InstanceSettings.create({ organizationCreationEnabled: { value: false } }),
    );
    const session = { userId: "user1" } as Session;
    const headers = {};
    const organization = Organization.create({
      name: "Test Organization",
      slug: "test-organization",
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

  it("should throw DuplicateOrganizationSlugError when creating organization with existing slug", async () => {
    const slug = "existing-slug";
    mockOrganizationsRepository.findOneBySlug.mockResolvedValue({ slug } as Organization);

    const session = { userId: "user1" } as Session;
    const headers = {};

    await expect(
      service.createOrganization(
        { name: "Test", slug, metadata: {} },
        session,
        headers,
        UserRole.ADMIN,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
