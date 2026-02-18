import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { User } from "../../domain/user";
import { UsersRepository } from "../../infrastructure/adapters/users.repository";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  let service: UsersService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      save: jest.fn(),
      findOneById: jest.fn(),
      findOneByEmail: jest.fn(),
      findAllByIds: jest.fn(),
      setUserEmailVerified: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should create user", async () => {
    await service.createUser("test@example.com", "John", "Doe");
    expect(mockRepo.save).toHaveBeenCalledWith(expect.any(User));
  });

  it("should find one by id", async () => {
    mockRepo.findOneById.mockResolvedValue({ id: "1" });
    await service.findOne("1");
    expect(mockRepo.findOneById).toHaveBeenCalledWith("1");
  });

  it("should throw if not found in findOneAndFail", async () => {
    mockRepo.findOneById.mockResolvedValue(null);
    await expect(service.findOneAndFail("1")).rejects.toThrow(NotFoundInDatabaseException);
  });

  it("should find all by ids via batched repository call", async () => {
    mockRepo.findAllByIds.mockResolvedValue([{ id: "1" }]);

    const result = await service.findAllByIds(["1", "2"]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
    expect(mockRepo.findAllByIds).toHaveBeenCalledWith(["1", "2"]);
  });
});
