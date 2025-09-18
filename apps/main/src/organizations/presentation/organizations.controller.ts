import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
} from '@nestjs/common';
import { OrganizationsService } from '../infrastructure/organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { Organization } from '../domain/organization';
import { PermissionService } from '@app/permission';
import * as authRequest from '@app/auth/auth-request';
import { UsersService } from '../../users/infrastructure/users.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly userService: UsersService,
    private readonly organizationsService: OrganizationsService,
    private readonly permissionsService: PermissionService,
  ) {}

  @Post()
  async create(
    @Request() req: authRequest.AuthRequest,
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    const user = await this.userService.findOne(
      req.authContext.keycloakUser.sub,
    );
    if (!user) {
      throw new NotFoundException();
    }
    const organization = Organization.create({
      name: createOrganizationDto.name,
      user: user,
    });

    return this.organizationsService.save(organization);
  }

  @Get()
  async findAll(@Request() req: authRequest.AuthRequest) {
    return (
      await this.organizationsService.findAllWhereMember(req.authContext)
    ).filter((organization) =>
      this.permissionsService.canAccessOrganization(
        organization.id,
        req.authContext,
      ),
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      id,
      req.authContext,
    );
    return this.organizationsService.findOneOrFail(id);
  }

  @Post(':organizationId/invite')
  async inviteUser(
    @Request() req: authRequest.AuthRequest,
    @Param('organizationId') organizationId: string,
    @Body() body: { email: string },
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    return this.organizationsService.inviteUser(
      req.authContext,
      organizationId,
      body.email,
    );
  }

  @Get(':id/members')
  async getMembers(
    @Param('id') id: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      id,
      req.authContext,
    );
    const organization = await this.findOne(id, req);
    if (!organization) {
      throw new NotFoundException();
    }
    return organization.members;
  }
}
