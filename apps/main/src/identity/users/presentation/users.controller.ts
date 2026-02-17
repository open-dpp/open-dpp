import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "@open-dpp/exception";
import { UsersService } from "../application/services/users.service";
import { User } from "../domain/user";

export const CreateUserDtoSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
});

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) { }

  @Post()
  async createUser(@Body(new ZodValidationPipe(CreateUserDtoSchema)) body: CreateUserDto) {
    await this.usersService.createUser(body.email, body.firstName, body.lastName);
  }

  @Get(":id")
  async getUser(@Param("id") id: string): Promise<User | null> {
    return this.usersService.findOne(id);
  }
}
