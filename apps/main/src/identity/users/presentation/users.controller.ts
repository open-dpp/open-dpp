import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { z } from "zod";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { CreateUserCommand } from "../application/commands/create-user.command";
import { GetUserQuery } from "../application/queries/get-user.query";
import { User } from "../domain/user";

export const CreateUserDtoSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  image: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;

@Controller("users")
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  @Post()
  async createUser(@Body(new ZodValidationPipe(CreateUserDtoSchema)) body: CreateUserDto) {
    await this.commandBus.execute(new CreateUserCommand(body.email, body.name, body.image));
  }

  @Get(":id")
  async getUser(@Param("id") id: string): Promise<User | null> {
    return this.queryBus.execute(new GetUserQuery(id));
  }
}
