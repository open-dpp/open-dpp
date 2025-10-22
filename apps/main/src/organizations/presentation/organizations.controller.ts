import type { CreateOrganizationDto } from "./dto/create-organization.dto";
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { hasPermission, OrganizationSubject, PermissionAction } from "@open-dpp/permission";
import { Session, UserSession } from "@thallesp/nestjs-better-auth";
import { User } from "../../users/domain/user";
import { Organization } from "../domain/organization";
import { OrganizationsService } from "../infrastructure/organizations.service";

@Controller("organizations")
export class OrganizationsController {
  private readonly organizationsService: OrganizationsService;

  constructor(
    organizationsService: OrganizationsService,
  ) {
    this.organizationsService = organizationsService;
  }

  @Post()
  async create(
    @Session() session: UserSession,
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    const user = User.loadFromDb({
      id: session.user.id,
      email: session.user.email,
      keycloakUserId: session.user.id,
    });
    if (!hasPermission({
      user: {
        id: session.user.id,
      },
    }, PermissionAction.CREATE, OrganizationSubject)) {
      throw new ForbiddenException();
    }
    const organization = Organization.create({
      name: createOrganizationDto.name,
      createdByUserId: session.user.id,
      ownedByUserId: session.user.id,
      members: [user],
    });

    return this.organizationsService.save(organization);
  }

  @Get()
  async findAll(@Session() session: UserSession) {
    const user = User.loadFromDb({
      id: session.user.id,
      email: session.user.email,
      keycloakUserId: session.user.id,
    });
    const organizations = await this.organizationsService.findAllWhereMember(user);
    const accessibleOrganizations = [];
    for (const organization of organizations) {
      const can = hasPermission({
        user: {
          id: user.id,
        },
      }, PermissionAction.READ, organization.toPermissionSubject());
      if (can) {
        accessibleOrganizations.push(organization);
      }
    }
    return accessibleOrganizations;
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @Session() session: UserSession,
  ) {
    const organization = await this.organizationsService.findOneOrFail(id);
    if (!hasPermission({
      user: {
        id: session.user.id,
      },
    }, PermissionAction.READ, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }
    return organization;
  }

  @Post(":organizationId/invite")
  async inviteUser(
    @Session() session: UserSession,
    @Param("organizationId") organizationId: string,
    @Body() body: { email: string },
  ) {
    const organization = await this.organizationsService.findOneOrFail(organizationId);
    if (!hasPermission({
      user: {
        id: session.user.id,
      },
    }, PermissionAction.UPDATE, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }
    return this.organizationsService.inviteUser(
      session,
      organizationId,
      body.email,
    );
  }

  @Get(":id/members")
  async getMembers(
    @Param("id") id: string,
    @Session() session: UserSession,
  ) {
    const organization = await this.organizationsService.findOneOrFail(id);
    if (!hasPermission({
      user: {
        id: session.user.id,
      },
    }, PermissionAction.READ, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }
    if (!organization) {
      throw new NotFoundException();
    }
    return organization.members;
  }
}
