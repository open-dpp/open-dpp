import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Session } from "../../../auth/domain/session";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { Organization } from "../../domain/organization";
import { InvitationsRepository } from "../../infrastructure/adapters/invitations.repository";
import { MembersRepository } from "../../infrastructure/adapters/members.repository";
import { OrganizationsRepository } from "../../infrastructure/adapters/organizations.repository";
import { OrganizationsService } from "./organizations.service";

describe("OrganizationsService", () => {
  let service: OrganizationsService;

  const mockOrganizationsRepository = {
    findOneBySlug: jest.fn<(slug: string) => Promise<Organization | null>>(),
    create: jest.fn(),
    findOneById: jest.fn(),
    update: jest.fn(),
  };

  const mockMembersRepository = {
    findOneByUserIdAndOrganizationId: jest.fn(),
  };

  const mockUsersRepository = {
    findOneById: jest.fn(),
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
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
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
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
