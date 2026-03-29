import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundError } from "@open-dpp/exception";
import { AUTH } from "../../../auth/auth.provider";
import { User } from "../../domain/user";
import { UserRole } from "../../domain/user-role.enum";
import { UsersRepository } from "../../infrastructure/adapters/users.repository";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  let service: UsersService;
  let mockRepo: any;
  let mockAuth: any;

  beforeEach(async () => {
    mockRepo = {
      save: jest.fn(),
      findOneById: jest.fn(),
      findOneByEmail: jest.fn(),
      findAllByIds: jest.fn(),
      update: jest.fn(),
    };

    mockAuth = {
      api: {
        requestPasswordReset: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockRepo },
        { provide: AUTH, useValue: mockAuth },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should create user", async () => {
    const savedUser = User.create({ email: "test@example.com", firstName: "John", lastName: "Doe" });
    mockRepo.save.mockResolvedValue(savedUser);
    const result = await service.createUser("test@example.com", "John", "Doe");
    expect(mockRepo.save).toHaveBeenCalledWith(expect.any(User));
    expect(result).toBe(savedUser);
  });

  it("should throw if save returns null", async () => {
    mockRepo.save.mockResolvedValue(null);
    await expect(service.createUser("test@example.com", "John", "Doe"))
      .rejects
      .toThrow("Failed to save user with email test@example.com");
  });

  it("should find one by id", async () => {
    mockRepo.findOneById.mockResolvedValue({ id: "1" });
    const result = await service.findOne("1");
    expect(mockRepo.findOneById).toHaveBeenCalledWith("1");
    expect(result).toEqual({ id: "1" });
  });

  it("should throw if not found in findOneAndFail", async () => {
    mockRepo.findOneById.mockResolvedValue(null);
    await expect(service.findOneAndFail("1")).rejects.toThrow(NotFoundError);
  });

  it("should find all by ids via batched repository call", async () => {
    mockRepo.findAllByIds.mockResolvedValue([{ id: "1" }]);

    const result = await service.findAllByIds(["1", "2"]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
    expect(mockRepo.findAllByIds).toHaveBeenCalledWith(["1", "2"]);
  });

  it("should set user role via domain method", async () => {
    const user = User.create({ email: "test@example.com", firstName: "John", lastName: "Doe", role: UserRole.USER });
    const updatedUser = user.withRole(UserRole.ADMIN);
    mockRepo.findOneById.mockResolvedValue(user);
    mockRepo.update.mockResolvedValue(updatedUser);

    const result = await service.setUserRole(user.id, UserRole.ADMIN);

    expect(mockRepo.findOneById).toHaveBeenCalledWith(user.id);
    expect(mockRepo.update).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.ADMIN }));
    expect(result.role).toBe(UserRole.ADMIN);
  });

  it("should throw if user not found when setting role", async () => {
    mockRepo.findOneById.mockResolvedValue(null);

    await expect(service.setUserRole("nonexistent", UserRole.ADMIN))
      .rejects
      .toThrow(NotFoundError);
  });

  it("should throw if repository fails to update role", async () => {
    const user = User.create({ email: "test@example.com", firstName: "John", lastName: "Doe" });
    mockRepo.findOneById.mockResolvedValue(user);
    mockRepo.update.mockResolvedValue(null);

    await expect(service.setUserRole(user.id, UserRole.ADMIN))
      .rejects
      .toThrow(`Failed to update role for user ${user.id}`);
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

    await expect(service.setUserEmailVerified("nonexistent@example.com", true))
      .rejects
      .toThrow(NotFoundError);
  });

  it("should throw if repository fails to update email verified", async () => {
    const user = User.create({ email: "test@example.com", firstName: "John", lastName: "Doe" });
    mockRepo.findOneByEmail.mockResolvedValue(user);
    mockRepo.update.mockResolvedValue(null);

    await expect(service.setUserEmailVerified("test@example.com", true))
      .rejects
      .toThrow(NotFoundError);
  });
});
