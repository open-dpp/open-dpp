import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "../application/services/users.service";
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
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it("should create user", async () => {
    const dto = { email: "test@example.com", firstName: "John", lastName: "Doe" };
    const createdUser = { id: "1", ...dto };
    mockService.createUser.mockResolvedValue(createdUser);
    const result = await controller.createUser(dto);
    expect(mockService.createUser).toHaveBeenCalledWith(dto.email, dto.firstName, dto.lastName);
    expect(result).toEqual(createdUser);
  });

  it("should get user by id", async () => {
    mockService.findOne.mockResolvedValue({ id: "1" });
    const result = await controller.getUser("1");
    expect(result).toEqual({ id: "1" });
    expect(mockService.findOne).toHaveBeenCalledWith("1");
  });

  it("should set user role", async () => {
    const user = User.create({ email: "test@example.com", firstName: "John", lastName: "Doe", role: UserRole.USER });
    const updatedUser = user.withRole(UserRole.ADMIN);
    mockService.setUserRole.mockResolvedValue(updatedUser);

    const result = await controller.setUserRole(user.id, { role: "admin" });

    expect(mockService.setUserRole).toHaveBeenCalledWith(user.id, "admin");
    expect(result.role).toBe(UserRole.ADMIN);
  });
});
