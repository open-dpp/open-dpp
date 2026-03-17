import type { CreateUserDto } from "@open-dpp/dto";
import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { CreateUserDtoSchema } from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { UserHasRole } from "../../auth/presentation/decorators/user-has-role.decorator";
import { UsersService } from "../application/services/users.service";
import { User } from "../domain/user";
import { UserRole } from "../domain/user-role.enum";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) { }

  @Post()
  @UserHasRole([UserRole.ADMIN])
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
