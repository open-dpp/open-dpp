import {
  type CreateUserDto,
  CreateUserDtoSchema,
  type InvitationResponseDto,
  InvitationResponseSchema,
  type SetUserRoleDto,
  SetUserRoleDtoSchema,
} from "@open-dpp/dto";
import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ZodValidationPipe } from "@open-dpp/exception";
import { UserHasRole } from "../../auth/presentation/decorators/user-has-role.decorator";
import { UsersService } from "../application/services/users.service";
import { User } from "../domain/user";
import { UserRole, UserRoleEnum } from "../domain/user-role.enum";
import { UserEmailDecorator } from "../../auth/presentation/decorators/user-email.decorator";
import { InvitationsRepository } from "../../organizations/infrastructure/adapters/invitations.repository";
import { Invitation } from "../../organizations/domain/invitation";
import { OrganizationsRepository } from "../../organizations/infrastructure/adapters/organizations.repository";
import { InvitationPopulateDecorator } from "../../organizations/application/invitation-populate-decorator";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly organizationRepository: OrganizationsRepository,
    private readonly invitationsRepository: InvitationsRepository,
  ) {}

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

  @Get("me/invitations")
  async getInvitations(@UserEmailDecorator() email: string): Promise<InvitationResponseDto[]> {
    const invitations = await this.invitationsRepository.findByEmail(email);
    const populatedInvitations = await Promise.all(
      invitations.map(async (i: Invitation) => {
        const decorator = new InvitationPopulateDecorator(
          i,
          this.organizationRepository,
          this.usersService,
        );

        return (await decorator.populate()).toPlain();
      }),
    );
    return InvitationResponseSchema.array().parse(populatedInvitations);
  }
}
