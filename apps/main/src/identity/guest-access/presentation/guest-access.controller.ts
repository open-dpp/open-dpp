import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import {
  type CreateGuestAccessDto,
  CreateGuestAccessDtoSchema,
  type GuestAccessResponseDto,
  type UpdateGuestAccessRoleDto,
  UpdateGuestAccessRoleDtoSchema,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { MemberHasRole } from "../../auth/presentation/decorators/member-has-role.decorator";
import { UserIdDecorator } from "../../auth/presentation/decorators/user-id.decorator";
import { OrganizationId } from "../../auth/presentation/decorators/organization-id.decorator";
import { MemberRole } from "../../organizations/domain/member-role.enum";
import { UsersRepository } from "../../users/infrastructure/adapters/users.repository";
import { GuestAccessService } from "../application/services/guest-access.service";
import { toGuestAccessResponseDto } from "./guest-access-dto.mapper";

@Controller("guest-accesses")
export class GuestAccessController {
  constructor(
    private readonly guestAccessService: GuestAccessService,
    private readonly usersRepository: UsersRepository,
  ) {}

  @MemberHasRole([MemberRole.OWNER])
  @Post()
  async invite(
    @Body(new ZodValidationPipe(CreateGuestAccessDtoSchema)) body: CreateGuestAccessDto,
    @OrganizationId() organizationId: string,
    @UserIdDecorator() userId: string,
  ): Promise<GuestAccessResponseDto> {
    const guestAccess = await this.guestAccessService.invite({
      organizationId,
      actingUserId: userId,
      email: body.email,
      guestRole: body.guestRole,
    });
    return toGuestAccessResponseDto(guestAccess);
  }

  @MemberHasRole([MemberRole.OWNER])
  @Get()
  async list(
    @OrganizationId() organizationId: string,
    @UserIdDecorator() userId: string,
  ): Promise<GuestAccessResponseDto[]> {
    const guestAccesses = await this.guestAccessService.list(organizationId, userId);
    return guestAccesses.map(toGuestAccessResponseDto);
  }

  @MemberHasRole([MemberRole.OWNER])
  @Patch(":id/role")
  async changeRole(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateGuestAccessRoleDtoSchema)) body: UpdateGuestAccessRoleDto,
    @OrganizationId() organizationId: string,
    @UserIdDecorator() userId: string,
  ): Promise<GuestAccessResponseDto> {
    const guestAccess = await this.guestAccessService.changeGuestRole({
      organizationId,
      guestAccessId: id,
      actingUserId: userId,
      guestRole: body.guestRole,
    });
    return toGuestAccessResponseDto(guestAccess);
  }

  @MemberHasRole([MemberRole.OWNER])
  @Post(":id/revoke")
  async revoke(
    @Param("id") id: string,
    @OrganizationId() organizationId: string,
    @UserIdDecorator() userId: string,
  ): Promise<GuestAccessResponseDto> {
    const guestAccess = await this.guestAccessService.revoke({
      organizationId,
      guestAccessId: id,
      actingUserId: userId,
    });
    return toGuestAccessResponseDto(guestAccess);
  }

  // Called by the invited person, who does not belong to the organization and sends no
  // organization header. The service checks that the account's verified email matches.
  @Post(":id/accept")
  async accept(
    @Param("id") id: string,
    @UserIdDecorator() userId: string,
  ): Promise<GuestAccessResponseDto> {
    const user = await this.usersRepository.findOneOrFail(userId);
    const guestAccess = await this.guestAccessService.accept(id, user);
    return toGuestAccessResponseDto(guestAccess);
  }
}
