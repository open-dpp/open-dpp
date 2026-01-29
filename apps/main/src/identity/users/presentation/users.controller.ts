import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { User } from "../domain/user";
import { UsersService } from "../infrastructure/users.service";

export const CreateUserDtoSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  image: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) { }

  @Post()
  async createUser(@Body(new ZodValidationPipe(CreateUserDtoSchema)) body: CreateUserDto) {
    await this.usersService.createUser(body.email, body.name as any, body.image);
  }

  @Get(":id")
  async getUser(@Param("id") id: string): Promise<User | null> {
    return this.usersService.getUser(id);
  }
}
