import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { Language } from "@open-dpp/dto";
import { UsersService } from "../application/services/users.service";
import { Session } from "../../auth/domain/session";
import { EmailChangeRequestsService } from "../../email-change-requests/application/services/email-change-requests.service";
import { EmailChangeRequest } from "../../email-change-requests/domain/email-change-request";
import { EmailService } from "../../../email/email.service";
import { User } from "../domain/user";
import { UserRole } from "../domain/user-role.enum";
import { UsersController } from "./users.controller";

describe("UsersController", () => {
  let controller: UsersController;
  let mockUsersService: any;
  let mockEmailChangeRequestsService: any;
  let mockEmailService: any;
  let mockEnvService: any;

  beforeEach(async () => {
    mockUsersService = {
      createUser: jest.fn(),
      findOne: jest.fn(),
      setUserRole: jest.fn(),
      getMe: jest.fn(),
      updateProfile: jest.fn(),
    };
    mockEmailChangeRequestsService = {
      findByUserId: jest.fn(),
      request: jest.fn(),
      hardCancel: jest.fn(),
    };
    mockEmailService = {
      send: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };
    mockEnvService = {
      get: jest.fn((key: string) => {
        if (key === "OPEN_DPP_URL") return "https://open-dpp.test";
        if (key === "OPEN_DPP_AUTH_SECRET") return "test-secret-32-chars-min-........";
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: EmailChangeRequestsService, useValue: mockEmailChangeRequestsService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: EnvService, useValue: mockEnvService },
      ],
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
    mockUsersService.createUser.mockResolvedValue(createdUser);

    const result = await controller.createUser(dto);

    expect(mockUsersService.createUser).toHaveBeenCalledWith(
      dto.email,
      dto.firstName,
      dto.lastName,
    );
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
    mockUsersService.findOne.mockResolvedValue(user);

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
    mockUsersService.setUserRole.mockResolvedValue(updatedUser);

    const result = await controller.setUserRole(user.id, { role: "admin" });

    expect(mockUsersService.setUserRole).toHaveBeenCalledWith(user.id, "admin");
    expect(result.id).toBe(user.id);
    expect(result).not.toHaveProperty("role");
  });

  describe("getMe", () => {
    it("returns the current user as a MeDto with no pendingEmailChange when none is pending", async () => {
      const user = User.create({
        email: "me@example.com",
        firstName: "Me",
        lastName: "Self",
        role: UserRole.ADMIN,
      });
      mockUsersService.getMe.mockResolvedValue(user);
      mockEmailChangeRequestsService.findByUserId.mockResolvedValue(null);
      const session = { userId: user.id } as unknown as Session;

      const result = await controller.getMe(session);

      expect(mockUsersService.getMe).toHaveBeenCalledWith(user.id);
      expect(mockEmailChangeRequestsService.findByUserId).toHaveBeenCalledWith(user.id);
      expect(result.user.id).toBe(user.id);
      expect(result.user.email).toBe(user.email);
      expect(result.user.firstName).toBe("Me");
      expect(result.user.preferredLanguage).toBe(Language.en);
      expect(result.user).not.toHaveProperty("role");
      expect(result.pendingEmailChange).toBeNull();
    });

    it("returns the pending email change when one exists", async () => {
      const user = User.create({
        email: "me@example.com",
        firstName: "Me",
        lastName: "Self",
      });
      const pending = EmailChangeRequest.create({ userId: user.id, newEmail: "new@example.com" });
      mockUsersService.getMe.mockResolvedValue(user);
      mockEmailChangeRequestsService.findByUserId.mockResolvedValue(pending);
      const session = { userId: user.id } as unknown as Session;

      const result = await controller.getMe(session);

      expect(result.pendingEmailChange).toEqual({
        newEmail: "new@example.com",
        requestedAt: pending.requestedAt,
      });
    });
  });

  describe("updateProfile", () => {
    it("forwards the body and session user id to the service and returns a MeDto", async () => {
      const user = User.create({
        email: "me@example.com",
        firstName: "Old",
        lastName: "Name",
      });
      const updated = user.withName("New", "Name").withPreferredLanguage(Language.de);
      mockUsersService.updateProfile.mockResolvedValue(updated);
      mockEmailChangeRequestsService.findByUserId.mockResolvedValue(null);
      const session = { userId: user.id } as unknown as Session;
      const body = { firstName: "New", preferredLanguage: Language.de } as const;

      const result = await controller.updateProfile(session, body);

      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(user.id, body);
      expect(result.user.firstName).toBe("New");
      expect(result.user.preferredLanguage).toBe(Language.de);
      expect(result.user).not.toHaveProperty("role");
      expect(result.pendingEmailChange).toBeNull();
    });
  });

  describe("requestEmailChange", () => {
    it("calls the EmailChangeRequestsService.request, sends a notification, and returns a MeDto", async () => {
      const user = User.create({
        email: "me@example.com",
        firstName: "Me",
        lastName: "Self",
      });
      const pending = EmailChangeRequest.create({ userId: user.id, newEmail: "fresh@example.com" });
      mockUsersService.getMe.mockResolvedValue(user);
      mockEmailChangeRequestsService.request.mockResolvedValue(pending);
      const session = { userId: user.id } as unknown as Session;
      const headers: Record<string, string> = {
        cookie: "better-auth.session=abc",
        "x-api-key": "key-1",
        "user-agent": "jest",
      };

      const result = await controller.requestEmailChange(session, headers, {
        newEmail: "fresh@example.com",
        currentPassword: "hunter2",
      });

      expect(mockEmailChangeRequestsService.request).toHaveBeenCalledWith(
        user.id,
        "fresh@example.com",
        user.email,
        "hunter2",
        {
          cookie: "better-auth.session=abc",
          "x-api-key": "key-1",
        },
      );
      expect(mockEmailService.send).toHaveBeenCalledTimes(1);
      expect(result.pendingEmailChange?.newEmail).toBe("fresh@example.com");
      expect(result.user).not.toHaveProperty("role");
    });

    it("still returns a MeDto when the notification email send fails (best-effort)", async () => {
      const user = User.create({
        email: "me@example.com",
        firstName: "Me",
        lastName: "Self",
      });
      const pending = EmailChangeRequest.create({ userId: user.id, newEmail: "fresh@example.com" });
      mockUsersService.getMe.mockResolvedValue(user);
      mockEmailChangeRequestsService.request.mockResolvedValue(pending);
      mockEmailService.send.mockRejectedValue(new Error("smtp down"));
      const session = { userId: user.id } as unknown as Session;

      const result = await controller.requestEmailChange(
        session,
        { cookie: "x" },
        { newEmail: "fresh@example.com", currentPassword: "hunter2" },
      );

      expect(result.pendingEmailChange?.newEmail).toBe("fresh@example.com");
    });
  });

  describe("cancelEmailChange", () => {
    it("forwards the user id to the service and returns a MeDto with a null pending change", async () => {
      const user = User.create({
        email: "me@example.com",
        firstName: "Me",
        lastName: "Self",
      });
      mockEmailChangeRequestsService.hardCancel.mockResolvedValue(undefined);
      mockUsersService.getMe.mockResolvedValue(user);
      const session = { userId: user.id } as unknown as Session;

      const result = await controller.cancelEmailChange(session);

      expect(mockEmailChangeRequestsService.hardCancel).toHaveBeenCalledWith(user.id);
      expect(result.pendingEmailChange).toBeNull();
      expect(result.user).not.toHaveProperty("role");
    });
  });
});
