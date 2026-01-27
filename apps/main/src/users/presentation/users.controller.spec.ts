import { expect, jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CreateUserCommand } from "../application/commands/create-user.command";
import { CreateUserDtoSchema, UsersController } from "./users.controller";

describe("usersController", () => {
  let controller: UsersController;
  let commandBus: CommandBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    commandBus = module.get<CommandBus>(CommandBus);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("createUser", () => {
    it("should call commandBus.execute with valid data", async () => {
      const validData = {
        email: "test@example.com",
        name: "Test User",
        image: "http://example.com/image.png",
      };

      await controller.createUser(validData);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreateUserCommand(validData.email, validData.name, validData.image),
      );
    });

    it("should validate inputs using the pipe directly (logic check)", () => {
      const pipe = new ZodValidationPipe(CreateUserDtoSchema);

      const validData = { email: "test@example.com" };
      expect(pipe.transform(validData, { type: "body" })).toEqual(validData);

      const invalidData = { email: "not-an-email" };
      expect(() => pipe.transform(invalidData, { type: "body" })).toThrow(BadRequestException);
    });
  });
});
