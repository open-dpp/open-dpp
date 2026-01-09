import { expect, jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("authController", () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getSession: jest.fn(),
            getAllOrganizations: jest.fn(),
            getOrganizationNameIfUserInvited: jest.fn(),
            auth: {},
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe("getOrganizations", () => {
    it("should throw ForbiddenException if session is null", async () => {
      jest.spyOn(authService, "getSession").mockResolvedValue(null as any);
      const req = { headers: {} } as any;

      await expect(controller.getOrganizations(req)).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if user is missing in session", async () => {
      jest.spyOn(authService, "getSession").mockResolvedValue({ session: {}, user: null } as any);
      const req = { headers: {} } as any;

      await expect(controller.getOrganizations(req)).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if user role is not admin", async () => {
      jest.spyOn(authService, "getSession").mockResolvedValue({
        session: {},
        user: { role: "user" },
      } as any);
      const req = { headers: {} } as any;

      await expect(controller.getOrganizations(req)).rejects.toThrow(ForbiddenException);
    });

    it("should return organizations if user is admin", async () => {
      const orgs = [{ id: 1, name: "Org 1" }];
      jest.spyOn(authService, "getSession").mockResolvedValue({
        session: {},
        user: { role: "admin" },
      } as any);
      jest.spyOn(authService, "getAllOrganizations").mockResolvedValue(orgs as any);
      const req = { headers: {} } as any;

      const result = await controller.getOrganizations(req);
      expect(result).toEqual(orgs);
    });
  });
});
