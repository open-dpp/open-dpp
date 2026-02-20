import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { ZodValidationPipe } from "@open-dpp/exception";
import { z } from "zod";
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
  async createUser(@Body(new ZodValidationPipe(CreateUserDtoSchema)) body: CreateUserDto): Promise<User> {
    return this.usersService.createUser(body.email, body.firstName, body.lastName);
  }

  @Get(":id")
  async getUser(@Param("id") id: string): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }
}
