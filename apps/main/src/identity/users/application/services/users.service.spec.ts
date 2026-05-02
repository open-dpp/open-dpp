import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { Language } from "@open-dpp/dto";
import { NotFoundError, NotFoundInDatabaseException, ValueError } from "@open-dpp/exception";
import { AUTH } from "../../../auth/auth.provider";
import { User } from "../../domain/user";
import { UserRole } from "../../domain/user-role.enum";
import { UsersRepository } from "../../infrastructure/adapters/users.repository";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  let service: UsersService;
  let mockRepo: any;
  let mockAuth: any;
  let mockEnv: any;

  beforeEach(async () => {
    mockRepo = {
      save: jest.fn(),
      findOneOrFail: jest.fn(),
      findOneById: jest.fn(),
      findOneByEmail: jest.fn(),
      findAllByIds: jest.fn(),
      update: jest.fn(),
    };

    mockAuth = {
      api: {
        requestPasswordReset: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        changeEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      },
    };

    mockEnv = {
      get: jest.fn((key: string) => {
        if (key === "OPEN_DPP_URL") return "https://open-dpp.test";
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockRepo },
        { provide: AUTH, useValue: mockAuth },
        { provide: EnvService, useValue: mockEnv },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should create user", async () => {
    const savedUser = User.create({
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
    });
    mockRepo.save.mockResolvedValue(savedUser);
    const result = await service.createUser("test@example.com", "John", "Doe");
    expect(mockRepo.save).toHaveBeenCalledWith(expect.any(User));
    expect(result).toBe(savedUser);
  });

  it("should throw if save returns null", async () => {
    mockRepo.save.mockResolvedValue(null);
    await expect(service.createUser("test@example.com", "John", "Doe")).rejects.toThrow(
      "Failed to save user with email test@example.com",
    );
  });

  it("should find one by id", async () => {
    mockRepo.findOneById.mockResolvedValue({ id: "1" });
    const result = await service.findOne("1");
    expect(mockRepo.findOneById).toHaveBeenCalledWith("1");
    expect(result).toEqual({ id: "1" });
  });

  it("should propagate repository error in findOneOrFail", async () => {
    mockRepo.findOneOrFail.mockRejectedValue(new NotFoundInDatabaseException(User.name));
    await expect(service.findOneOrFail("1")).rejects.toThrow(NotFoundInDatabaseException);
  });

  it("should find all by ids via batched repository call", async () => {
    mockRepo.findAllByIds.mockResolvedValue([{ id: "1" }]);

    const result = await service.findAllByIds(["1", "2"]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
    expect(mockRepo.findAllByIds).toHaveBeenCalledWith(["1", "2"]);
  });

  it("should set user role via domain method", async () => {
    const user = User.create({
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.USER,
    });
    const updatedUser = user.withRole(UserRole.ADMIN);
    mockRepo.findOneOrFail.mockResolvedValue(user);
    mockRepo.update.mockResolvedValue(updatedUser);

    const result = await service.setUserRole(user.id, UserRole.ADMIN);

    expect(mockRepo.findOneOrFail).toHaveBeenCalledWith(user.id);
    expect(mockRepo.update).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.ADMIN }));
    expect(result.role).toBe(UserRole.ADMIN);
  });

  it("should throw if user not found when setting role", async () => {
    mockRepo.findOneOrFail.mockRejectedValue(new NotFoundInDatabaseException(User.name));

    await expect(service.setUserRole("nonexistent", UserRole.ADMIN)).rejects.toThrow(
      NotFoundInDatabaseException,
    );
  });

  it("should throw if repository fails to update role", async () => {
    const user = User.create({ email: "test@example.com", firstName: "John", lastName: "Doe" });
    mockRepo.findOneOrFail.mockResolvedValue(user);
    mockRepo.update.mockResolvedValue(null);

    await expect(service.setUserRole(user.id, UserRole.ADMIN)).rejects.toThrow(NotFoundError);
  });

  it("should set user email verified via domain method", async () => {
    const user = User.create({ email: "test@example.com", firstName: "John", lastName: "Doe" });
    const updatedUser = user.withEmailVerified(true);
    mockRepo.findOneByEmail.mockResolvedValue(user);
    mockRepo.update.mockResolvedValue(updatedUser);

    const result = await service.setUserEmailVerified("test@example.com", true);

    expect(mockRepo.findOneByEmail).toHaveBeenCalledWith("test@example.com");
    expect(mockRepo.update).toHaveBeenCalledWith(expect.objectContaining({ emailVerified: true }));
    expect(result.emailVerified).toBe(true);
  });

  it("should throw if user not found when setting email verified", async () => {
    mockRepo.findOneByEmail.mockResolvedValue(null);

    await expect(service.setUserEmailVerified("nonexistent@example.com", true)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("should throw if repository fails to update email verified", async () => {
    const user = User.create({ email: "test@example.com", firstName: "John", lastName: "Doe" });
    mockRepo.findOneByEmail.mockResolvedValue(user);
    mockRepo.update.mockResolvedValue(null);

    await expect(service.setUserEmailVerified("test@example.com", true)).rejects.toThrow(
      NotFoundError,
    );
  });

  describe("getMe", () => {
    it("delegates to the repository's findOneOrFail", async () => {
      const user = User.create({ email: "me@example.com", firstName: "Me", lastName: "Self" });
      mockRepo.findOneOrFail.mockResolvedValue(user);

      const result = await service.getMe(user.id);

      expect(mockRepo.findOneOrFail).toHaveBeenCalledWith(user.id);
      expect(result).toBe(user);
    });

    it("propagates NotFoundInDatabaseException when the user is missing", async () => {
      mockRepo.findOneOrFail.mockRejectedValue(new NotFoundInDatabaseException(User.name));

      await expect(service.getMe("unknown")).rejects.toThrow(NotFoundInDatabaseException);
    });
  });

  describe("updateProfile", () => {
    const loadUser = () =>
      User.create({
        email: "user@example.com",
        firstName: "Old",
        lastName: "Name",
        preferredLanguage: Language.en,
      });

    it("propagates not-found errors from the repository", async () => {
      mockRepo.findOneOrFail.mockRejectedValue(new NotFoundInDatabaseException(User.name));

      await expect(service.updateProfile("nonexistent", { firstName: "Anything" })).rejects.toThrow(
        NotFoundInDatabaseException,
      );
    });

    it("updates firstName while preserving lastName", async () => {
      const user = loadUser();
      mockRepo.findOneOrFail.mockResolvedValue(user);
      mockRepo.update.mockImplementation(async (u: User) => u);

      const result = await service.updateProfile(user.id, { firstName: "New" });

      expect(mockRepo.update).toHaveBeenCalledTimes(1);
      expect(mockRepo.update.mock.calls[0][0].firstName).toBe("New");
      expect(mockRepo.update.mock.calls[0][0].lastName).toBe("Name");
      expect(result.firstName).toBe("New");
    });

    it("updates lastName while preserving firstName", async () => {
      const user = loadUser();
      mockRepo.findOneOrFail.mockResolvedValue(user);
      mockRepo.update.mockImplementation(async (u: User) => u);

      const result = await service.updateProfile(user.id, { lastName: "Changed" });

      expect(mockRepo.update.mock.calls[0][0].firstName).toBe("Old");
      expect(mockRepo.update.mock.calls[0][0].lastName).toBe("Changed");
      expect(result.lastName).toBe("Changed");
    });

    it("updates preferredLanguage", async () => {
      const user = loadUser();
      mockRepo.findOneOrFail.mockResolvedValue(user);
      mockRepo.update.mockImplementation(async (u: User) => u);

      const result = await service.updateProfile(user.id, { preferredLanguage: Language.de });

      expect(mockRepo.update.mock.calls[0][0].preferredLanguage).toBe(Language.de);
      expect(result.preferredLanguage).toBe(Language.de);
    });

    it("composes multiple changes into a single update call", async () => {
      const user = loadUser();
      mockRepo.findOneOrFail.mockResolvedValue(user);
      mockRepo.update.mockImplementation(async (u: User) => u);

      await service.updateProfile(user.id, {
        firstName: "Jane",
        lastName: "Roe",
        preferredLanguage: Language.de,
      });

      expect(mockRepo.update).toHaveBeenCalledTimes(1);
      const persisted = mockRepo.update.mock.calls[0][0] as User;
      expect(persisted.firstName).toBe("Jane");
      expect(persisted.lastName).toBe("Roe");
      expect(persisted.preferredLanguage).toBe(Language.de);
    });

    it("short-circuits when the patch is empty", async () => {
      const user = loadUser();
      mockRepo.findOneOrFail.mockResolvedValue(user);

      const result = await service.updateProfile(user.id, {});

      expect(mockRepo.update).not.toHaveBeenCalled();
      expect(result).toBe(user);
    });

    it("short-circuits when the patch values match the current user (no DB write)", async () => {
      const user = loadUser();
      mockRepo.findOneOrFail.mockResolvedValue(user);

      const result = await service.updateProfile(user.id, {
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        preferredLanguage: user.preferredLanguage,
      });

      expect(mockRepo.update).not.toHaveBeenCalled();
      expect(result).toBe(user);
    });

    it("throws NotFoundError when the repository update returns null", async () => {
      const user = loadUser();
      mockRepo.findOneOrFail.mockResolvedValue(user);
      mockRepo.update.mockResolvedValue(null);

      await expect(service.updateProfile(user.id, { firstName: "Jane" })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("requestEmailChange", () => {
    const loadUser = () =>
      User.create({
        email: "current@example.com",
        firstName: "Cur",
        lastName: "Rent",
      });

    it("calls auth.api.changeEmail and persists pendingEmail on the user", async () => {
      const user = loadUser();
      mockRepo.findOneOrFail.mockResolvedValue(user);
      mockRepo.findOneByEmail.mockResolvedValue(null);
      mockRepo.update.mockImplementation(async (u: User) => u);
      const headers = { cookie: "better-auth.session=abc" };

      const result = await service.requestEmailChange(user.id, "new@example.com", headers);

      expect(mockRepo.findOneOrFail).toHaveBeenCalledWith(user.id);
      expect(mockRepo.findOneByEmail).toHaveBeenCalledWith("new@example.com");
      expect(mockAuth.api.changeEmail).toHaveBeenCalledWith({
        body: {
          newEmail: "new@example.com",
          callbackURL: "https://open-dpp.test/profile",
        },
        headers,
      });
      expect(mockRepo.update).toHaveBeenCalledTimes(1);
      const persisted = mockRepo.update.mock.calls[0][0] as User;
      expect(persisted.pendingEmail).toBe("new@example.com");
      expect(persisted.pendingEmailRequestedAt).toBeInstanceOf(Date);
      expect(result.pendingEmail).toBe("new@example.com");
    });

    it("rejects requests where the new email matches the current email", async () => {
      const user = loadUser();
      mockRepo.findOneOrFail.mockResolvedValue(user);

      await expect(
        service.requestEmailChange(user.id, user.email, { cookie: "x" }),
      ).rejects.toThrow(ValueError);
      expect(mockRepo.findOneByEmail).not.toHaveBeenCalled();
      expect(mockAuth.api.changeEmail).not.toHaveBeenCalled();
    });

    it("rejects requests when an email change is already pending", async () => {
      const user = loadUser().withPendingEmail("first@example.com", new Date());
      mockRepo.findOneOrFail.mockResolvedValue(user);

      await expect(
        service.requestEmailChange(user.id, "second@example.com", { cookie: "x" }),
      ).rejects.toThrow(/already pending/i);
      expect(mockRepo.findOneByEmail).not.toHaveBeenCalled();
      expect(mockAuth.api.changeEmail).not.toHaveBeenCalled();
    });

    it("rejects requests where the new email is already taken by another user", async () => {
      const user = loadUser();
      const other = User.create({
        email: "taken@example.com",
        firstName: "Other",
        lastName: "User",
      });
      mockRepo.findOneOrFail.mockResolvedValue(user);
      mockRepo.findOneByEmail.mockResolvedValue(other);

      await expect(
        service.requestEmailChange(user.id, "taken@example.com", { cookie: "x" }),
      ).rejects.toThrow(ValueError);
      expect(mockAuth.api.changeEmail).not.toHaveBeenCalled();
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("propagates errors from Better Auth and does not persist pending", async () => {
      const user = loadUser();
      mockRepo.findOneOrFail.mockResolvedValue(user);
      mockRepo.findOneByEmail.mockResolvedValue(null);
      mockAuth.api.changeEmail.mockRejectedValue(new Error("better auth blew up"));

      await expect(
        service.requestEmailChange(user.id, "fresh@example.com", { cookie: "x" }),
      ).rejects.toThrow("better auth blew up");
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("propagates not-found errors when the user is missing", async () => {
      mockRepo.findOneOrFail.mockRejectedValue(new NotFoundInDatabaseException(User.name));

      await expect(
        service.requestEmailChange("nonexistent", "new@example.com", { cookie: "x" }),
      ).rejects.toThrow(NotFoundInDatabaseException);
      expect(mockAuth.api.changeEmail).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when the repository update returns null after persisting pending", async () => {
      const user = loadUser();
      mockRepo.findOneOrFail.mockResolvedValue(user);
      mockRepo.findOneByEmail.mockResolvedValue(null);
      mockRepo.update.mockResolvedValue(null);

      await expect(
        service.requestEmailChange(user.id, "new@example.com", { cookie: "x" }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("cancelEmailChange", () => {
    it("clears the pending pair and returns the updated user", async () => {
      const user = User.create({
        email: "current@example.com",
        firstName: "Cur",
        lastName: "Rent",
      }).withPendingEmail("new@example.com", new Date());
      mockRepo.findOneOrFail.mockResolvedValue(user);
      mockRepo.update.mockImplementation(async (u: User) => u);

      const result = await service.cancelEmailChange(user.id);

      const persisted = mockRepo.update.mock.calls[0][0] as User;
      expect(persisted.pendingEmail).toBeNull();
      expect(persisted.pendingEmailRequestedAt).toBeNull();
      expect(result.pendingEmail).toBeNull();
    });

    it("rejects when nothing is pending", async () => {
      const user = User.create({
        email: "current@example.com",
        firstName: "Cur",
        lastName: "Rent",
      });
      mockRepo.findOneOrFail.mockResolvedValue(user);

      await expect(service.cancelEmailChange(user.id)).rejects.toThrow(ValueError);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("propagates not-found from the repository", async () => {
      mockRepo.findOneOrFail.mockRejectedValue(new NotFoundInDatabaseException(User.name));

      await expect(service.cancelEmailChange("nonexistent")).rejects.toThrow(
        NotFoundInDatabaseException,
      );
    });

    it("throws NotFoundError when the update returns null", async () => {
      const user = User.create({
        email: "current@example.com",
        firstName: "Cur",
        lastName: "Rent",
      }).withPendingEmail("new@example.com", new Date());
      mockRepo.findOneOrFail.mockResolvedValue(user);
      mockRepo.update.mockResolvedValue(null);

      await expect(service.cancelEmailChange(user.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe("clearPendingEmailFor", () => {
    it("clears pending when set", async () => {
      const user = User.create({
        email: "current@example.com",
        firstName: "Cur",
        lastName: "Rent",
      }).withPendingEmail("new@example.com", new Date());
      mockRepo.findOneById.mockResolvedValue(user);
      mockRepo.update.mockImplementation(async (u: User) => u);

      await service.clearPendingEmailFor(user.id);

      const persisted = mockRepo.update.mock.calls[0][0] as User;
      expect(persisted.pendingEmail).toBeNull();
    });

    it("is a no-op when nothing is pending", async () => {
      const user = User.create({
        email: "current@example.com",
        firstName: "Cur",
        lastName: "Rent",
      });
      mockRepo.findOneById.mockResolvedValue(user);

      await service.clearPendingEmailFor(user.id);

      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("is a no-op when the user is not found", async () => {
      mockRepo.findOneById.mockResolvedValue(null);

      await service.clearPendingEmailFor("nonexistent");

      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });
});
