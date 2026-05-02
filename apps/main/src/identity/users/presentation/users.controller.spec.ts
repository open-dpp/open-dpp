import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { Language } from "@open-dpp/dto";
import { UsersService } from "../application/services/users.service";
import { Session } from "../../auth/domain/session";
import { User } from "../domain/user";
import { UserRole } from "../domain/user-role.enum";
import { UsersController } from "./users.controller";

describe("UsersController", () => {
  let controller: UsersController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      createUser: jest.fn(),
      findOne: jest.fn(),
      setUserRole: jest.fn(),
      getMe: jest.fn(),
      updateProfile: jest.fn(),
      requestEmailChange: jest.fn(),
      cancelEmailChange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it("should create user and return a UserDto", async () => {
    const dto = { email: "test@example.com", firstName: "John", lastName: "Doe" };
    const createdUser = User.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    mockService.createUser.mockResolvedValue(createdUser);

    const result = await controller.createUser(dto);

    expect(mockService.createUser).toHaveBeenCalledWith(dto.email, dto.firstName, dto.lastName);
    expect(result).toEqual(
      expect.objectContaining({
        id: createdUser.id,
        email: createdUser.email,
        firstName: "John",
        lastName: "Doe",
      }),
    );
    expect(result).not.toHaveProperty("role");
    expect(result).not.toHaveProperty("banned");
  });

  it("should get user by id and return a UserDto without admin fields", async () => {
    const user = User.create({
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.ADMIN,
      banned: true,
    });
    mockService.findOne.mockResolvedValue(user);

    const result = await controller.getUser(user.id);

    expect(result.id).toBe(user.id);
    expect(result).not.toHaveProperty("role");
    expect(result).not.toHaveProperty("banned");
    expect(result).not.toHaveProperty("banReason");
    expect(result).not.toHaveProperty("banExpires");
  });

  it("should set user role and return a UserDto", async () => {
    const user = User.create({
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.USER,
    });
    const updatedUser = user.withRole(UserRole.ADMIN);
    mockService.setUserRole.mockResolvedValue(updatedUser);

    const result = await controller.setUserRole(user.id, { role: "admin" });

    expect(mockService.setUserRole).toHaveBeenCalledWith(user.id, "admin");
    expect(result.id).toBe(user.id);
    expect(result).not.toHaveProperty("role");
  });

  describe("getMe", () => {
    it("returns the current user as a UserDto", async () => {
      const user = User.create({
        email: "me@example.com",
        firstName: "Me",
        lastName: "Self",
        role: UserRole.ADMIN,
      });
      mockService.getMe.mockResolvedValue(user);
      const session = { userId: user.id } as unknown as Session;

      const result = await controller.getMe(session);

      expect(mockService.getMe).toHaveBeenCalledWith(user.id);
      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result.firstName).toBe("Me");
      expect(result.preferredLanguage).toBe(Language.en);
      expect(result).not.toHaveProperty("role");
    });
  });

  describe("updateProfile", () => {
    it("forwards the body and session user id to the service and returns a UserDto", async () => {
      const user = User.create({
        email: "me@example.com",
        firstName: "Old",
        lastName: "Name",
      });
      const updated = user.withName("New", "Name").withPreferredLanguage(Language.de);
      mockService.updateProfile.mockResolvedValue(updated);
      const session = { userId: user.id } as unknown as Session;
      const body = { firstName: "New", preferredLanguage: Language.de } as const;

      const result = await controller.updateProfile(session, body);

      expect(mockService.updateProfile).toHaveBeenCalledWith(user.id, body);
      expect(result.firstName).toBe("New");
      expect(result.preferredLanguage).toBe(Language.de);
      expect(result).not.toHaveProperty("role");
    });
  });

  describe("requestEmailChange", () => {
    it("extracts auth-relevant headers, forwards to service, and returns the updated UserDto", async () => {
      const user = User.create({
        email: "me@example.com",
        firstName: "Me",
        lastName: "Self",
      }).withPendingEmail("fresh@example.com", new Date("2026-04-30T12:00:00Z"));
      mockService.requestEmailChange.mockResolvedValue(user);
      const session = { userId: user.id } as unknown as Session;
      const headers: Record<string, string> = {
        cookie: "better-auth.session=abc",
        "x-api-key": "key-1",
        "user-agent": "jest",
      };

      const result = await controller.requestEmailChange(session, headers, {
        newEmail: "fresh@example.com",
      });

      expect(mockService.requestEmailChange).toHaveBeenCalledWith(user.id, "fresh@example.com", {
        cookie: "better-auth.session=abc",
        "x-api-key": "key-1",
      });
      expect(result.pendingEmail).toBe("fresh@example.com");
      expect(result).not.toHaveProperty("role");
    });
  });

  describe("cancelEmailChange", () => {
    it("forwards the user id to the service and returns the updated UserDto", async () => {
      const user = User.create({
        email: "me@example.com",
        firstName: "Me",
        lastName: "Self",
      });
      mockService.cancelEmailChange.mockResolvedValue(user);
      const session = { userId: user.id } as unknown as Session;

      const result = await controller.cancelEmailChange(session);

      expect(mockService.cancelEmailChange).toHaveBeenCalledWith(user.id);
      expect(result.pendingEmail).toBeNull();
      expect(result).not.toHaveProperty("role");
    });
  });
});
