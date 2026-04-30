import type {
  CreateUserDto,
  RequestEmailChangeDto,
  SetUserRoleDto,
  UpdateProfileDto,
  UserDto,
} from "@open-dpp/dto";
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import {
  CreateUserDtoSchema,
  RequestEmailChangeDtoSchema,
  SetUserRoleDtoSchema,
  UpdateProfileDtoSchema,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { extractBetterAuthHeaders } from "../../auth/domain/better-auth-headers";
import { Session as SessionDomainEntity } from "../../auth/domain/session";
import { AuthSession } from "../../auth/presentation/decorators/auth-session.decorator";
import { UserHasRole } from "../../auth/presentation/decorators/user-has-role.decorator";
import { UsersService } from "../application/services/users.service";
import { UserRole, UserRoleEnum } from "../domain/user-role.enum";
import { UserMapper } from "../infrastructure/mappers/user.mapper";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UserHasRole([UserRole.ADMIN])
  async createUser(
    @Body(new ZodValidationPipe(CreateUserDtoSchema)) body: CreateUserDto,
  ): Promise<UserDto> {
    const user = await this.usersService.createUser(body.email, body.firstName, body.lastName);
    return UserMapper.toDto(user);
  }

  @Get("me")
  async getMe(@AuthSession() session: SessionDomainEntity): Promise<UserDto> {
    const user = await this.usersService.getMe(session.userId);
    return UserMapper.toDto(user);
  }

  @Patch("me")
  async updateProfile(
    @AuthSession() session: SessionDomainEntity,
    @Body(new ZodValidationPipe(UpdateProfileDtoSchema)) body: UpdateProfileDto,
  ): Promise<UserDto> {
    const user = await this.usersService.updateProfile(session.userId, body);
    return UserMapper.toDto(user);
  }

  @Post("me/email-change")
  @HttpCode(HttpStatus.ACCEPTED)
  async requestEmailChange(
    @AuthSession() session: SessionDomainEntity,
    @Headers() headers: Record<string, string>,
    @Body(new ZodValidationPipe(RequestEmailChangeDtoSchema)) body: RequestEmailChangeDto,
  ): Promise<void> {
    await this.usersService.requestEmailChange(
      session.userId,
      body.newEmail,
      extractBetterAuthHeaders(headers),
    );
  }

  @Patch(":id/role")
  @UserHasRole([UserRole.ADMIN])
  async setUserRole(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(SetUserRoleDtoSchema)) body: SetUserRoleDto,
  ): Promise<UserDto> {
    const user = await this.usersService.setUserRole(id, UserRoleEnum.parse(body.role));
    return UserMapper.toDto(user);
  }

  @Get(":id")
  async getUser(@Param("id") id: string): Promise<UserDto> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return UserMapper.toDto(user);
  }
}
