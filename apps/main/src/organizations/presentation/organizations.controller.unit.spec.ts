import type { TestingModule } from "@nestjs/testing";
import type { AuthRequest, PermissionService } from "@open-dpp/auth";
import type { Organization } from "../domain/organization";
import type { CreateOrganizationDto } from "./dto/create-organization.dto";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AuthContext } from "@open-dpp/auth";
import { createKeycloakUserInToken } from "@open-dpp/testing";
import { OrganizationsService } from "../infrastructure/organizations.service";
import { OrganizationsController } from "./organizations.controller";

// We'll mock the implementation directly instead of extending the controller

describe("organizationsController (Unit)", () => {
  let controller: OrganizationsController;
  let organizationsService: OrganizationsService;
  let PermissionService: PermissionService;

  const mockUser = createKeycloakUserInToken();
  const authContext = new AuthContext();
  authContext.keycloakUser = mockUser;

  const mockRequest = {
    authContext,
  } as AuthRequest;

  beforeEach(async () => {
    // Create mock services
    const mockOrganizationsService = {
      save: jest.fn(),
      findOneOrFail: jest.fn(),
      findAllWhereMember: jest.fn(),
      inviteUser: jest.fn(),
    };

    const mockPermissionService = {
      canAccessOrganization: jest.fn(),
      canAccessOrganizationOrFail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        { provide: OrganizationsService, useValue: mockOrganizationsService },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
    organizationsService
      = module.get<OrganizationsService>(OrganizationsService);
    PermissionService = module.get<PermissionService>(PermissionService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create an organization", async () => {
      // Setup
      const createDto: CreateOrganizationDto = { name: "Test Organization" };
      const organizationId = randomUUID();
      const expectedOrg = {
        id: organizationId,
        name: createDto.name,
        ownedByUserId: mockUser.id,
        createdByUserId: mockUser.id,
      };

      // Mock
      jest
        .spyOn(organizationsService, "save")
        .mockResolvedValue(expectedOrg as Organization);

      // Execute
      const result = await controller.create(mockRequest, createDto);

      // Verify
      expect(result).toEqual(expectedOrg);
      expect(organizationsService.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createDto.name,
          createdByUserId: mockUser.id,
          ownedByUserId: mockUser.id,
        }),
      );
    });
  });

  describe("findAll", () => {
    // Since we can't mock filter directly, we'll test that the service's findAllWhereMember
    // is called with the correct arguments
    it("should call findAllWhereMember with the correct auth context", async () => {
      // Setup
      const mockOrgs = [
        { id: randomUUID(), name: "Org 1" },
        { id: randomUUID(), name: "Org 2" },
      ] as Organization[];

      // Mock
      jest
        .spyOn(organizationsService, "findAllWhereMember")
        .mockResolvedValue(mockOrgs);
      jest
        .spyOn(PermissionService, "canAccessOrganization")
        .mockResolvedValue(true);

      // Execute
      await controller.findAll(mockRequest);

      // Verify
      expect(organizationsService.findAllWhereMember).toHaveBeenCalledWith(
        authContext,
      );
    });

    it("should call canAccessOrganization for each organization", async () => {
      // Setup
      const orgId1 = randomUUID();
      const orgId2 = randomUUID();
      const mockOrgs = [
        { id: orgId1, name: "Org 1" },
        { id: orgId2, name: "Org 2" },
      ] as Organization[];

      // Mock
      jest
        .spyOn(organizationsService, "findAllWhereMember")
        .mockResolvedValue(mockOrgs);
      const permissionsSpy = jest
        .spyOn(PermissionService, "canAccessOrganization")
        .mockResolvedValue(true);

      // Execute
      await controller.findAll(mockRequest);

      // Verify proper permission checks were made
      expect(permissionsSpy).toHaveBeenCalledWith(orgId1, authContext);
      expect(permissionsSpy).toHaveBeenCalledWith(orgId2, authContext);
    });
  });

  describe("findOne", () => {
    it("should return an organization when user has access", async () => {
      // Setup
      const orgId = randomUUID();
      const mockOrg = { id: orgId, name: "Test Org" } as Organization;

      // Mock
      jest
        .spyOn(PermissionService, "canAccessOrganizationOrFail")
        .mockResolvedValue(true);
      jest
        .spyOn(organizationsService, "findOneOrFail")
        .mockResolvedValue(mockOrg);

      // Execute
      const result = await controller.findOne(orgId, mockRequest);

      // Verify
      expect(result).toEqual(mockOrg);
      expect(
        PermissionService.canAccessOrganizationOrFail,
      ).toHaveBeenCalledWith(orgId, authContext);
    });

    it("should throw ForbiddenException when user has no access", async () => {
      // Setup
      const orgId = randomUUID();

      // Mock
      jest
        .spyOn(PermissionService, "canAccessOrganizationOrFail")
        .mockRejectedValue(new ForbiddenException());

      // Execute & Verify
      await expect(controller.findOne(orgId, mockRequest)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("inviteUser", () => {
    it("should invite a user to an organization", async () => {
      // Setup
      const orgId = randomUUID();
      const email = "invite@example.com";

      // Mock
      jest
        .spyOn(PermissionService, "canAccessOrganizationOrFail")
        .mockResolvedValue(true);
      jest
        .spyOn(organizationsService, "inviteUser")
        .mockResolvedValue(undefined);

      // Execute
      await controller.inviteUser(mockRequest, orgId, { email });

      // Verify
      expect(
        PermissionService.canAccessOrganizationOrFail,
      ).toHaveBeenCalledWith(orgId, authContext);
      expect(organizationsService.inviteUser).toHaveBeenCalledWith(
        authContext,
        orgId,
        email,
      );
    });

    it("should throw ForbiddenException when user has no access", async () => {
      // Setup
      const orgId = randomUUID();
      const email = "invite@example.com";

      // Mock
      jest
        .spyOn(PermissionService, "canAccessOrganizationOrFail")
        .mockRejectedValue(new ForbiddenException());

      // Execute & Verify
      await expect(
        controller.inviteUser(mockRequest, orgId, { email }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("getMembers", () => {
    it("should return the members of an organization", async () => {
      // Setup
      const orgId = randomUUID();
      const mockOrg = {
        id: orgId,
        name: "Test Org",
        members: [
          { id: mockUser.id, email: mockUser.email },
          { id: randomUUID(), email: "member2@example.com" },
        ],
      } as Organization;

      // Mock
      jest
        .spyOn(PermissionService, "canAccessOrganizationOrFail")
        .mockResolvedValue(true);
      jest
        .spyOn(organizationsService, "findOneOrFail")
        .mockResolvedValue(mockOrg);

      // Execute
      const result = await controller.getMembers(orgId, mockRequest);

      // Verify
      expect(result).toEqual(mockOrg.members);
      expect(
        PermissionService.canAccessOrganizationOrFail,
      ).toHaveBeenCalledWith(orgId, authContext);
    });

    it("should throw ForbiddenException when user has no access", async () => {
      // Setup
      const orgId = randomUUID();

      // Mock
      jest
        .spyOn(PermissionService, "canAccessOrganizationOrFail")
        .mockRejectedValue(new ForbiddenException());

      // Execute & Verify
      await expect(controller.getMembers(orgId, mockRequest)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw NotFoundException when organization is not found", async () => {
      // Setup
      const orgId = randomUUID();

      // Mock
      jest
        .spyOn(PermissionService, "canAccessOrganizationOrFail")
        .mockResolvedValue(true);
      jest
        .spyOn(organizationsService, "findOneOrFail")
        .mockRejectedValue(new NotFoundException());

      // Execute & Verify
      await expect(controller.getMembers(orgId, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
