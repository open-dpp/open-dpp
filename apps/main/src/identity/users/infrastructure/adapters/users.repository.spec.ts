import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { ObjectId } from "mongodb";
import { AUTH } from "../../../auth/auth.provider";
import { User } from "../../domain/user";
import { UserRole } from "../../domain/user-role.enum";
import { User as UserSchema } from "../schemas/user.schema";
import { UsersRepository } from "./users.repository";

describe("UsersRepository", () => {
  let repository: UsersRepository;
  let mockUserModel: any;
  let mockAuth: any;

  beforeEach(async () => {
    mockUserModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneById: jest.fn(),
    };
    mockAuth = {
      api: {
        createUser: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getModelToken(UserSchema.name),
          useValue: mockUserModel,
        },
        {
          provide: AUTH,
          useValue: mockAuth,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  it("should save user via auth api", async () => {
    const user = User.create({
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.USER,
    });

    mockUserModel.findOne.mockResolvedValue({
      _id: new ObjectId(),
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await repository.save(user);

    // Check that createUser was called with correct arguments
    expect(mockAuth.api.createUser).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({
        email: "test@example.com",
        name: "John Doe",
        data: expect.objectContaining({
          firstName: "John",
          lastName: "Doe",
        }),
      }),
    }));

    // Verify password was generated (should be a non-empty string)
    const callArgs = (mockAuth.api.createUser as jest.Mock).mock.calls[0][0] as any;
    expect(callArgs.body.password).toBeTruthy();
    expect(callArgs.body.password.length).toBeGreaterThan(0);

    expect(result).toBeInstanceOf(User);
  });

  it("should save user with provided password", async () => {
    const user = User.create({
      email: "test@example.com",
      firstName: "Jane",
      lastName: "Doe",
      role: UserRole.USER,
    });

    const userObjectId = new ObjectId();
    mockUserModel.findOne.mockResolvedValue({
      _id: userObjectId,
      email: "test@example.com",
    });

    await repository.save(user, "secure-password-123");

    expect(mockAuth.api.createUser).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({
        password: "secure-password-123",
      }),
    }));
  });

  it("should find one by id using workaround", async () => {
    const userObjectId = new ObjectId();
    const doc = {
      _id: userObjectId,
      email: "test@example.com",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUserModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(doc),
    });

    const result = await repository.findOneById(userObjectId.toString());

    expect(result).toBeInstanceOf(User);
    expect(result?.id).toBe(userObjectId.toString());
  });

  it("should find one by email", async () => {
    const userObjectId = new ObjectId();
    const doc = {
      _id: userObjectId,
      email: "test@example.com",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUserModel.findOne.mockResolvedValue(doc);

    const result = await repository.findOneByEmail("test@example.com");

    expect(result).toBeInstanceOf(User);
    expect(result?.email).toBe("test@example.com");
  });

  it("should find all by ids", async () => {
    const userObjectId = new ObjectId();
    const doc = {
      _id: userObjectId,
      email: "test@example.com",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUserModel.find.mockResolvedValue([doc]);

    const result = await repository.findAllByIds([userObjectId.toString()]);

    expect(result).toHaveLength(1);
    expect(mockUserModel.find).toHaveBeenCalledWith({ _id: { $in: [userObjectId.toString()] } });
  });

  it("should set email verified", async () => {
    await repository.setUserEmailVerified("test@example.com", true);
    expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
      { email: "test@example.com" },
      { $set: { emailVerified: true } },
    );
  });
});
