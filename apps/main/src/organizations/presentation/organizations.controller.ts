import type * as authRequest from "@open-dpp/auth";
import type { CreateOrganizationDto } from "./dto/create-organization.dto";
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
} from "@nestjs/common";
import { hasPermission, OrganizationSubject, PermissionAction } from "@open-dpp/permission";
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
    @Request() req: authRequest.AuthRequest,
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    const user = req.authContext.user as User;
    if (!hasPermission({
      user: {
        id: user.id,
      },
    }, PermissionAction.CREATE, OrganizationSubject)) {
      throw new ForbiddenException();
    }
    const organization = Organization.create({
      name: createOrganizationDto.name,
      createdByUserId: user.id,
      ownedByUserId: user.id,
      members: [user],
    });

    return this.organizationsService.save(organization);
  }

  @Get()
  async findAll(@Request() req: authRequest.AuthRequest) {
    const organizations = await this.organizationsService.findAllWhereMember(req.authContext);
    const accessibleOrganizations = [];
    for (const organization of organizations) {
      const can = hasPermission({
        user: {
          id: (req.authContext.user as User).id,
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
    @Request() req: authRequest.AuthRequest,
  ) {
    const organization = await this.organizationsService.findOneOrFail(id);
    if (!hasPermission({
      user: {
        id: (req.authContext.user as User).id,
      },
    }, PermissionAction.READ, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }
    return organization;
  }

  @Post(":organizationId/invite")
  async inviteUser(
    @Request() req: authRequest.AuthRequest,
    @Param("organizationId") organizationId: string,
    @Body() body: { email: string },
  ) {
    const organization = await this.organizationsService.findOneOrFail(organizationId);
    if (!hasPermission({
      user: {
        id: (req.authContext.user as User).id,
      },
    }, PermissionAction.UPDATE, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }
    return this.organizationsService.inviteUser(
      req.authContext,
      organizationId,
      body.email,
    );
  }

  @Get(":id/members")
  async getMembers(
    @Param("id") id: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    const organization = await this.findOne(id, req);
    if (!hasPermission({
      user: {
        id: (req.authContext.user as User).id,
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
