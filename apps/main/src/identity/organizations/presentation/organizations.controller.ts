import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Logger,
  Param,
  Patch,
  Post,
  UseFilters,
} from "@nestjs/common";
import { Session } from "../../auth/domain/session";
import { AuthSession } from "../../auth/presentation/decorators/auth-session.decorator";
import { MembersService } from "../application/services/members.service";
import { OrganizationsService } from "../application/services/organizations.service";
import { Member } from "../domain/member";
import { Organization } from "../domain/organization";
import { OrganizationExceptionFilter } from "./organization-exception.filter";

@Controller("organizations")
@UseFilters(OrganizationExceptionFilter)
export class OrganizationsController {
  private readonly logger = new Logger(OrganizationsController.name);

  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly membersService: MembersService,
  ) { }

  @Post()
  async createOrganization(
    @Body() body: { name: string; slug: string; logo?: string; metadata?: any },
    @Headers() headers: Record<string, string>,
    @AuthSession() session: Session,
  ) {
    return this.organizationsService.createOrganization(
      {
        name: body.name,
        slug: body.slug,
        logo: body.logo,
        metadata: {},
      },
      session,
      headers,
    );
  }

  // Returns all organizations for admin users
  // Otherwise responds with 403
  @Get()
  async getOrganizations(
    @AuthSession() session: Session,
  ) {
    return this.organizationsService.getAllOrganizations(session);
  }

  @Patch(":id")
  async updateOrganization(
    @Param("id") id: string,
    @Body() body: { name: string; slug: string; logo: string; metadata: any },
    @Headers() headers: Record<string, string>,
    @AuthSession() session: Session,
  ) {
    const isOwnerOrAdmin = await this.organizationsService.isOwnerOrAdmin(id, session.userId);
    if (!isOwnerOrAdmin) {
      throw new ForbiddenException("You are not authorized to update this organization");
    }

    await this.organizationsService.updateOrganization(
      id,
      {
        name: body.name,
        slug: body.slug,
        logo: body.logo,
        metadata: body.metadata,
      },
      session,
      headers,
    );
  }

  @Get("member")
  async getMemberOrganizations(
    @Headers() headers: Record<string, string>,
    @AuthSession() session: Session,
  ): Promise<Organization[]> {
    return this.organizationsService.getMemberOrganizations(session.userId, headers);
  }

  @Get(":id")
  async getOrganization(
    @Param("id") id: string,
    @AuthSession() session: Session,
  ): Promise<Organization | null> {
    return this.organizationsService.getOrganization(id, session);
  }

  @Get(":id/members")
  async getMembers(
    @Param("id") id: string,
    @AuthSession() session: Session,
  ): Promise<Member[]> {
    const isMember = await this.membersService.isMemberOfOrganization(session.userId, id);
    if (!isMember) {
      throw new ForbiddenException("You are not authorized to view members of this organization");
    }

    return this.organizationsService.getMembers(id);
  }

  @Get(":id/name")
  async getOrganizationNameIfInvited(
    @Param("id") organizationId: string,
    @AuthSession() session: Session,
  ) {
    const name = await this.organizationsService.getOrganizationNameIfUserInvited(organizationId, session);
    if (!name) {
      throw new ForbiddenException();
    }

    return { name };
  }
}
