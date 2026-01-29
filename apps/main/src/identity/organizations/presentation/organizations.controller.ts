import { Body, Controller, ForbiddenException, Get, Headers, Logger, Param, Patch, Post, Req, UnauthorizedException, UseFilters, UseGuards } from "@nestjs/common";
import { AuthService } from "../../auth/application/services/auth.service";
import { AuthGuard } from "../../auth/infrastructure/guards/auth.guard";
import { OrganizationsService } from "../application/services/organizations.service";
import { Member } from "../domain/member";
import { Organization } from "../domain/organization";
import { OrganizationExceptionFilter } from "./organization-exception.filter";

@Controller("organizations")
@UseFilters(OrganizationExceptionFilter)
export class OrganizationsController {
  private readonly logger = new Logger(OrganizationsController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly organizationsService: OrganizationsService,
  ) { }

  @Post()
  async createOrganization(
    @Body() body: { name: string; slug: string; logo?: string; metadata?: any },
    @Headers() headers: Record<string, string>,
  ) {
    // We need strict headers type for getSession usually, but let's try casting or passing as is if compatible
    const session = await this.authService.getSession(headers as any);
    if (!session) {
      throw new UnauthorizedException("Unauthorized");
    }
    return this.organizationsService.createOrganization(
      session.user.id,
      body.name,
      body.slug,
      headers,
      body.logo,
      body.metadata,
    );
  }

  @Patch(":id")
  async updateOrganization(
    @Param("id") id: string,
    @Body() body: { name?: string; slug?: string; logo?: string; metadata?: any },
    @Headers() headers: Record<string, string>,
  ) {
    const session = await this.authService.getSession(headers as any);
    if (!session) {
      throw new UnauthorizedException("Unauthorized");
    }

    const isOwnerOrAdmin = await this.organizationsService.isOwnerOrAdmin(id, session.user.id);
    if (!isOwnerOrAdmin) {
      throw new ForbiddenException("You are not authorized to update this organization");
    }

    await this.organizationsService.updateOrganization(
      id,
      body.name,
      body.slug,
      body.logo,
      body.metadata,
    );
  }

  @Get("member")
  async getMemberOrganizations(@Headers() headers: Record<string, string>): Promise<Organization[]> {
    this.logger.log("Member");
    const session = await this.authService.getSession(headers as any);
    if (!session) {
      throw new UnauthorizedException("Unauthorized");
    }
    return this.organizationsService.getMemberOrganizations(session.user.id, headers);
  }

  @Get(":id")
  async getOrganization(
    @Param("id") id: string,
    @Headers() headers: Record<string, string>,
  ): Promise<Organization | null> {
    return this.organizationsService.getOrganization(id, headers);
  }

  @Get(":id/members")
  @UseGuards(AuthGuard)
  async getMembers(
    @Param("id") id: string,
    @Req() request: any,
  ): Promise<Member[]> {
    const session = request.session;
    if (!session) {
      throw new UnauthorizedException("Unauthorized");
    }
    const isMember = await this.authService.isMemberOfOrganization(session.user.id, id);
    if (!isMember) {
      throw new ForbiddenException("You are not authorized to view members of this organization");
    }

    return this.organizationsService.getMembers(id);
  }
}
