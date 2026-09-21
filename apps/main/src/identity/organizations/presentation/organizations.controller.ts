import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { extractBetterAuthHeaders } from "../../auth/domain/better-auth-headers";
import { Session } from "../../auth/domain/session";
import { AuthSession } from "../../auth/presentation/decorators/auth-session.decorator";
import { MembersService } from "../application/services/members.service";
import { OrganizationsService } from "../application/services/organizations.service";
import { MemberWithUser } from "../domain/member";
import { MemberRole } from "../domain/member-role.enum";
import { toOrganizationDto } from "./organization-dto.mapper";
import { UserRoleDecorator } from "../../auth/presentation/decorators/user-role.decorator";
import { type UserRoleType } from "../../users/domain/user-role.enum";
import {
  InvitationResponseDto,
  type MemberRoleChangeDto,
  MemberRoleChangeDtoSchema,
  type OrganizationCreateDto,
  OrganizationCreateDtoSchema,
  type OrganizationDto,
  PolicyKeyList,
} from "@open-dpp/dto";
import { InvitationsRepository } from "../infrastructure/adapters/invitations.repository";
import { UsersRepository } from "../../users/infrastructure/adapters/users.repository";
import { UserEmailDecorator } from "../../auth/presentation/decorators/user-email.decorator";
import { InvitationPopulateDecorator } from "../application/invitation-populate-decorator";
import { OrganizationsRepository } from "../infrastructure/adapters/organizations.repository";
import { ZodValidationPipe } from "@open-dpp/exception";
import { OrganizationId } from "../../auth/presentation/decorators/organization-id.decorator";
import { MemberHasRole } from "../../auth/presentation/decorators/member-has-role.decorator";
import { Policy } from "../../../policy/presentation/policy.decorator";

@Controller("organizations")
export class OrganizationsController {
  private readonly logger = new Logger(OrganizationsController.name);

  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly membersService: MembersService,
    private readonly invitationsRepository: InvitationsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  @Post()
  async createOrganization(
    @Body(new ZodValidationPipe(OrganizationCreateDtoSchema)) body: OrganizationCreateDto,
    @Headers() headers: Record<string, string>,
    @AuthSession() session: Session,
    @UserRoleDecorator() userRole: UserRoleType,
  ): Promise<OrganizationDto> {
    const organization = await this.organizationsService.createOrganization(
      {
        name: body.name,
        metadata: {},
      },
      session,
      extractBetterAuthHeaders(headers),
      userRole,
    );
    return toOrganizationDto(organization);
  }

  // Returns all organizations for admin users
  // Otherwise responds with 403
  @Get()
  async getOrganizations(@AuthSession() session: Session): Promise<OrganizationDto[]> {
    const organizations = await this.organizationsService.getAllOrganizations(session);
    return organizations.map(toOrganizationDto);
  }

  @Patch(":id")
  async updateOrganization(
    @Param("id") id: string,
    @Body() body: { name: string; logo?: string },
    @Headers() headers: Record<string, string>,
    @AuthSession() session: Session,
  ): Promise<OrganizationDto> {
    const organization = await this.organizationsService.updateOrganization(
      id,
      {
        name: body.name,
        logo: body.logo,
      },
      session,
      extractBetterAuthHeaders(headers),
    );
    return toOrganizationDto(organization);
  }

  @Get("member")
  async getMemberOrganizations(
    @Headers() headers: Record<string, string>,
    @AuthSession() session: Session,
  ): Promise<OrganizationDto[]> {
    const organizations = await this.organizationsService.getMemberOrganizations(
      session.userId,
      extractBetterAuthHeaders(headers),
    );
    return organizations.map(toOrganizationDto);
  }

  @Get(":id")
  async getOrganization(
    @Param("id") id: string,
    @AuthSession() session: Session,
  ): Promise<OrganizationDto | null> {
    const organization = await this.organizationsService.getOrganization(id, session);
    return organization ? toOrganizationDto(organization) : null;
  }

  @Post(":id/invite")
  @Policy(PolicyKeyList.ORGANIZATION_MEMBER_LIMIT)
  async inviteMember(
    @Param("id") id: string,
    @Body() body: { email: string },
    @Headers() headers: Record<string, string>,
    @AuthSession() session: Session,
  ) {
    await this.organizationsService.inviteMember(
      body.email,
      MemberRole.MEMBER,
      id,
      session,
      extractBetterAuthHeaders(headers),
    );
  }

  @Get("invitations/:id")
  async getInvitation(
    @Param("id") invitationId: string,
    @UserEmailDecorator() email: string,
  ): Promise<InvitationResponseDto> {
    const foundInvitation = await this.invitationsRepository.findOneByIdOrFail(invitationId);
    if (foundInvitation.email !== email) {
      throw new ForbiddenException("You are not authorized to view this invitation");
    }
    const decorator = new InvitationPopulateDecorator(
      foundInvitation,
      this.organizationsRepository,
      this.usersRepository,
    );
    return (await decorator.populate()).toDto();
  }

  @Get(":id/members")
  async getMembers(
    @Param("id") id: string,
    @AuthSession() session: Session,
  ): Promise<MemberWithUser[]> {
    const isMember = await this.membersService.isMemberOfOrganization(session.userId, id);
    if (!isMember) {
      throw new ForbiddenException("You are not authorized to view members of this organization");
    }

    return this.membersService.getMembers(id);
  }

  @MemberHasRole([MemberRole.OWNER])
  @Patch("members/:id/role")
  async updateMemberRole(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(MemberRoleChangeDtoSchema)) body: MemberRoleChangeDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.membersService.updateMemberRole(organizationId, id, body.role);
  }

  @MemberHasRole([MemberRole.OWNER])
  @Delete("members/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param("id") id: string,
    @OrganizationId() organizationId: string,
    @AuthSession() session: Session,
  ) {
    await this.membersService.removeMember(organizationId, id, session.userId);
  }

  @Get(":id/name")
  async getOrganizationNameIfInvited(
    @Param("id") organizationId: string,
    @AuthSession() session: Session,
  ) {
    const name = await this.organizationsService.getOrganizationNameIfUserInvited(
      organizationId,
      session,
    );
    if (!name) {
      throw new ForbiddenException();
    }

    return { name };
  }
}
