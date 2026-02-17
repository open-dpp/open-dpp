import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Session } from "../../auth/domain/session";
import { UsersService } from "../../users/application/services/users.service";
import { MembersService } from "../application/services/members.service";
import { OrganizationsService } from "../application/services/organizations.service";
import { OrganizationsController } from "./organizations.controller";

describe("OrganizationsController", () => {
  let controller: OrganizationsController;
  let mockOrgsService: any;
  let mockMembersService: any;
  let mockUsersService: any;

  beforeEach(async () => {
    mockOrgsService = {
      createOrganization: jest.fn(),
      getAllOrganizations: jest.fn(),
      isOwnerOrAdmin: jest.fn(),
      updateOrganization: jest.fn(),
      getMemberOrganizations: jest.fn(),
      getOrganization: jest.fn(),
      getOrganizationNameIfUserInvited: jest.fn(),
      inviteMember: jest.fn(),
    };
    mockMembersService = {
      isMemberOfOrganization: jest.fn(),
      getMembers: jest.fn(),
    };
    mockUsersService = {
      findAllByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        { provide: OrganizationsService, useValue: mockOrgsService },
        { provide: MembersService, useValue: mockMembersService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
  });

  it("should create organization", async () => {
    const session = { userId: "user-1" } as Session;
    const body = { name: "Test", slug: "test" };
    const headers = {};

    await controller.createOrganization(body, headers, session);

    expect(mockOrgsService.createOrganization).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Test", slug: "test" }),
      session,
      headers,
    );
  });

  it("should update organization if authorized", async () => {
    const session = { userId: "user-1" } as Session;
    const body = { name: "Updated", slug: "updated", logo: "logo", metadata: {} };
    const headers = {};

    mockOrgsService.isOwnerOrAdmin.mockResolvedValue(true);
    mockOrgsService.updateOrganization.mockResolvedValue({});

    await controller.updateOrganization("org-1", body, headers, session);

    expect(mockOrgsService.updateOrganization).toHaveBeenCalled();
  });

  it("should throw ForbiddenException when updating without rights", async () => {
    const session = { userId: "user-1" } as Session;
    const body = { name: "Updated", slug: "updated", logo: "logo", metadata: {} };
    const headers = {};

    mockOrgsService.isOwnerOrAdmin.mockResolvedValue(false);

    await expect(controller.updateOrganization("org-1", body, headers, session))
      .rejects
      .toThrow(ForbiddenException);
  });

  it("should invite member if authorized", async () => {
    const session = { userId: "user-1" } as Session;
    const body = { email: "invite@example.com", role: "member" };
    const headers = {};

    mockOrgsService.isOwnerOrAdmin.mockResolvedValue(true);
    mockOrgsService.inviteMember.mockResolvedValue(undefined);

    await controller.inviteMember("org-1", body, headers, session);

    expect(mockOrgsService.isOwnerOrAdmin).toHaveBeenCalledWith("org-1", "user-1");
    expect(mockOrgsService.inviteMember).toHaveBeenCalledWith(
      "invite@example.com",
      "member",
      "org-1",
      session,
      headers,
    );
  });

  it("should throw ForbiddenException when inviting without rights", async () => {
    const session = { userId: "user-1" } as Session;
    const body = { email: "invite@example.com", role: "member" };
    const headers = {};

    mockOrgsService.isOwnerOrAdmin.mockResolvedValue(false);

    await expect(controller.inviteMember("org-1", body, headers, session))
      .rejects
      .toThrow(ForbiddenException);
  });
});
