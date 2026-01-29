import { expect, jest } from "@jest/globals";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { AuthService } from "../../auth/application/services/auth.service";
import { OrganizationsService } from "../application/services/organizations.service";
import { OrganizationsController } from "./organizations.controller";

describe("organizationsController", () => {
  let controller: OrganizationsController;
  let authService: AuthService;
  let organizationsService: OrganizationsService;

  const mockAuthService = {
    getSession: jest.fn<any>(),
    isMemberOfOrganization: jest.fn<any>(),
  };
  const mockOrganizationsService = {
    isOwnerOrAdmin: jest.fn<any>(),
    createOrganization: jest.fn<any>(),
    updateOrganization: jest.fn<any>(),
    getMemberOrganizations: jest.fn<any>(),
    getOrganization: jest.fn<any>(),
    getMembers: jest.fn<any>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: OrganizationsService, useValue: mockOrganizationsService },
        { provide: EnvService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
    authService = module.get<AuthService>(AuthService);
    organizationsService = module.get<OrganizationsService>(OrganizationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getMembers", () => {
    it("should throw UnauthorizedException if session is missing", async () => {
      const request = {};
      await expect(controller.getMembers("org-1", request)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw ForbiddenException if user is not a member", async () => {
      const request = {
        session: {
          user: { id: "user-1" },
        },
      };
      mockAuthService.isMemberOfOrganization.mockResolvedValue(false);

      await expect(controller.getMembers("org-1", request)).rejects.toThrow(
        ForbiddenException,
      );
      expect(authService.isMemberOfOrganization).toHaveBeenCalledWith(
        "user-1",
        "org-1",
      );
    });

    it("should return members if user is a member", async () => {
      const request = {
        session: {
          user: { id: "user-1" },
        },
      };
      mockAuthService.isMemberOfOrganization.mockResolvedValue(true);
      const expectedMembers = [{ userId: "user-1", organizationId: "org-1" }];
      mockOrganizationsService.getMembers.mockResolvedValue(expectedMembers);

      const result = await controller.getMembers("org-1", request);

      expect(result).toEqual(expectedMembers);
      expect(authService.isMemberOfOrganization).toHaveBeenCalledWith(
        "user-1",
        "org-1",
      );
      expect(organizationsService.getMembers).toHaveBeenCalledWith(
        "org-1",
      );
    });
  });
});
