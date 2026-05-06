import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type {
  CreateUserDto,
  InvitationResponseDto,
  InvitationStatusDtoType,
  MeDto,
  RequestEmailChangeDto,
  SetUserRoleDto,
  UpdateProfileDto,
  UserDto,
} from "@open-dpp/dto";
import {
  CreateUserDtoSchema,
  InvitationResponseSchema,
  RequestEmailChangeDtoSchema,
  SetUserRoleDtoSchema,
  UpdateProfileDtoSchema,
} from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { ZodValidationPipe } from "@open-dpp/exception";
import { EmailChangeNotificationMail } from "../../../email/domain/email-change-notification-mail";
import { EmailService } from "../../../email/email.service";
import { extractBetterAuthHeaders } from "../../auth/domain/better-auth-headers";
import { Session as SessionDomainEntity } from "../../auth/domain/session";
import { AuthSession } from "../../auth/presentation/decorators/auth-session.decorator";
import { UserEmailDecorator } from "../../auth/presentation/decorators/user-email.decorator";
import { UserHasRole } from "../../auth/presentation/decorators/user-has-role.decorator";
import { EmailChangeRequestsService } from "../../email-change-requests/application/services/email-change-requests.service";
import { signRevokeToken } from "../../email-change-requests/domain/revoke-token";
import { EmailChangeRequestMapper } from "../../email-change-requests/infrastructure/mappers/email-change-request.mapper";
import { InvitationPopulateDecorator } from "../../organizations/application/invitation-populate-decorator";
import { Invitation } from "../../organizations/domain/invitation";
import { InvitationsRepository } from "../../organizations/infrastructure/adapters/invitations.repository";
import { OrganizationsRepository } from "../../organizations/infrastructure/adapters/organizations.repository";
import { UsersService } from "../application/services/users.service";
import { UserRole, UserRoleEnum } from "../domain/user-role.enum";
import { UserMapper } from "../infrastructure/mappers/user.mapper";
import { InvitationStatusQueryParam } from "./users.decorators";

const REVOKE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Controller("users")
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly emailChangeRequestsService: EmailChangeRequestsService,
    private readonly emailService: EmailService,
    private readonly envService: EnvService,
    private readonly organizationRepository: OrganizationsRepository,
    private readonly invitationsRepository: InvitationsRepository,
  ) {}

  @Post()
  @UserHasRole([UserRole.ADMIN])
  async createUser(
    @Body(new ZodValidationPipe(CreateUserDtoSchema)) body: CreateUserDto,
  ): Promise<UserDto> {
    const user = await this.usersService.createUser(body.email, body.firstName, body.lastName);
    return UserMapper.toDto(user);
  }

  @Get("me")
  async getMe(@AuthSession() session: SessionDomainEntity): Promise<MeDto> {
    const user = await this.usersService.getMe(session.userId);
    const pending = await this.emailChangeRequestsService.findByUserId(session.userId);
    return {
      user: UserMapper.toDto(user),
      pendingEmailChange: pending ? EmailChangeRequestMapper.toDto(pending) : null,
    };
  }

  @Patch("me")
  async updateProfile(
    @AuthSession() session: SessionDomainEntity,
    @Body(new ZodValidationPipe(UpdateProfileDtoSchema)) body: UpdateProfileDto,
  ): Promise<MeDto> {
    const user = await this.usersService.updateProfile(session.userId, body);
    const pending = await this.emailChangeRequestsService.findByUserId(session.userId);
    return {
      user: UserMapper.toDto(user),
      pendingEmailChange: pending ? EmailChangeRequestMapper.toDto(pending) : null,
    };
  }

  @Post("me/email-change")
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 3, ttl: 3600_000 } })
  async requestEmailChange(
    @AuthSession() session: SessionDomainEntity,
    @Headers() headers: Record<string, string>,
    @Body(new ZodValidationPipe(RequestEmailChangeDtoSchema)) body: RequestEmailChangeDto,
  ): Promise<MeDto> {
    const user = await this.usersService.getMe(session.userId);
    const pending = await this.emailChangeRequestsService.request(
      session.userId,
      body.newEmail,
      user.email,
      body.currentPassword,
      extractBetterAuthHeaders(headers),
    );

    const revokeToken = signRevokeToken(
      { userId: user.id, requestId: pending.id },
      this.envService.get("OPEN_DPP_AUTH_SECRET"),
      REVOKE_TOKEN_TTL_MS,
    );
    const revokeUrl = `${this.envService.get("OPEN_DPP_URL")}/api/users/email-change/revoke?token=${encodeURIComponent(revokeToken)}`;

    try {
      await this.emailService.send(
        EmailChangeNotificationMail.create({
          to: user.email,
          subject: "Your email is being changed",
          templateProperties: {
            firstName: user.firstName ?? "User",
            currentEmail: user.email,
            newEmail: body.newEmail,
            revokeUrl,
          },
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email-change notification to ${user.email} for user ${user.id}`,
        error,
      );
    }

    return {
      user: UserMapper.toDto(user),
      pendingEmailChange: EmailChangeRequestMapper.toDto(pending),
    };
  }

  @Delete("me/email-change")
  async cancelEmailChange(@AuthSession() session: SessionDomainEntity): Promise<MeDto> {
    await this.emailChangeRequestsService.hardCancel(session.userId);
    const user = await this.usersService.getMe(session.userId);
    return {
      user: UserMapper.toDto(user),
      pendingEmailChange: null,
    };
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

  @Get("me/invitations")
  async getInvitations(
    @UserEmailDecorator() email: string,
    @InvitationStatusQueryParam() status: InvitationStatusDtoType | undefined,
  ): Promise<InvitationResponseDto[]> {
    const invitations = await this.invitationsRepository.findByEmail(email);
    const filteredInvitations = status
      ? invitations.filter((i) => i.status === status)
      : invitations;
    const populatedInvitations = await Promise.all(
      filteredInvitations.map(async (i: Invitation) => {
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
