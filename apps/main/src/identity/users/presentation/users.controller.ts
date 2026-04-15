import type { CreateUserDto, SetUserRoleDto } from "@open-dpp/dto";
import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { CreateUserDtoSchema, SetUserRoleDtoSchema } from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { UserHasRole } from "../../auth/presentation/decorators/user-has-role.decorator";
import { UsersService } from "../application/services/users.service";
import { User } from "../domain/user";
import { UserRole, UserRoleEnum } from "../domain/user-role.enum";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UserHasRole([UserRole.ADMIN])
  async createUser(
    @Body(new ZodValidationPipe(CreateUserDtoSchema)) body: CreateUserDto,
  ): Promise<User> {
    return this.usersService.createUser(body.email, body.firstName, body.lastName);
  }

  @Patch(":id/role")
  @UserHasRole([UserRole.ADMIN])
  async setUserRole(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(SetUserRoleDtoSchema)) body: SetUserRoleDto,
  ): Promise<User> {
    return this.usersService.setUserRole(id, UserRoleEnum.parse(body.role));
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
