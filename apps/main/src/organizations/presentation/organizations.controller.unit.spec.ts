import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthContext, AuthRequest, PermissionService } from "@open-dpp/auth";
import { createKeycloakUserInToken } from "@open-dpp/testing";
import { User } from "../../users/domain/user";
import { UsersService } from "../../users/infrastructure/users.service";
import { Organization } from "../domain/organization";
import { OrganizationsService } from "../infrastructure/organizations.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { OrganizationsController } from "./organizations.controller";

// We'll mock the implementation directly instead of extending the controller

describe("organizationsController (Unit)", () => {
  let controller: OrganizationsController;
  let organizationsService: OrganizationsService;
  let usersService: UsersService;

  let permissionService: PermissionService;

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

    const mockUserService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        { provide: OrganizationsService, useValue: mockOrganizationsService },
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: UsersService, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
    organizationsService
      = module.get<OrganizationsService>(OrganizationsService);
    permissionService = module.get<PermissionService>(PermissionService);
    usersService = module.get<UsersService>(UsersService);
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
        ownedByUserId: mockUser.sub,
        createdByUserId: mockUser.sub,
      };

      // Mock
      jest
        .spyOn(organizationsService, "save")
        .mockResolvedValue(expectedOrg as Organization);

      jest
        .spyOn(usersService, "findOne")
        .mockResolvedValue(User.loadFromDb({ id: mockUser.sub, email: mockUser.email }));

      // Execute
      const result = await controller.create(mockRequest, createDto);

      // Verify
      expect(result).toEqual(expectedOrg);
      expect(organizationsService.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createDto.name,
          createdByUserId: mockUser.sub,
          ownedByUserId: mockUser.sub,
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
        .spyOn(permissionService, "canAccessOrganization")
        .mockReturnValue(true);

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
        .spyOn(permissionService, "canAccessOrganization")
        .mockReturnValue(true);

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
        .spyOn(permissionService, "canAccessOrganizationOrFail")
        .mockReturnValue(true);
      jest
        .spyOn(organizationsService, "findOneOrFail")
        .mockResolvedValue(mockOrg);

      // Execute
      const result = await controller.findOne(orgId, mockRequest);

      // Verify
      expect(result).toEqual(mockOrg);
      expect(
        permissionService.canAccessOrganizationOrFail,
      ).toHaveBeenCalledWith(orgId, authContext);
    });

    it("should throw ForbiddenException when user has no access", async () => {
      // Setup
      const orgId = randomUUID();

      // Mock
      jest
        .spyOn(permissionService, "canAccessOrganizationOrFail")
        .mockImplementation(() => {
          throw new ForbiddenException();
        });

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
        .spyOn(permissionService, "canAccessOrganizationOrFail")
        .mockReturnValue(true);
      jest
        .spyOn(organizationsService, "inviteUser")
        .mockResolvedValue(undefined);

      // Execute
      await controller.inviteUser(mockRequest, orgId, { email });

      // Verify
      expect(
        permissionService.canAccessOrganizationOrFail,
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
        .spyOn(permissionService, "canAccessOrganizationOrFail")
        .mockImplementation(() => {
          throw new ForbiddenException();
        });

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
          { id: mockUser.sub, email: mockUser.email },
          { id: randomUUID(), email: "member2@example.com" },
        ],
      } as Organization;

      // Mock
      jest
        .spyOn(permissionService, "canAccessOrganizationOrFail")
        .mockReturnValue(true);
      jest
        .spyOn(organizationsService, "findOneOrFail")
        .mockResolvedValue(mockOrg);

      // Execute
      const result = await controller.getMembers(orgId, mockRequest);

      // Verify
      expect(result).toEqual(mockOrg.members);
      expect(
        permissionService.canAccessOrganizationOrFail,
      ).toHaveBeenCalledWith(orgId, authContext);
    });

    it("should throw ForbiddenException when user has no access", async () => {
      // Setup
      const orgId = randomUUID();

      // Mock
      jest
        .spyOn(permissionService, "canAccessOrganizationOrFail")
        .mockImplementation(() => {
          throw new ForbiddenException();
        });

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
        .spyOn(permissionService, "canAccessOrganizationOrFail")
        .mockReturnValue(true);
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
