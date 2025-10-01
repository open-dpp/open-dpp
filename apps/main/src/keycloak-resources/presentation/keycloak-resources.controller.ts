import { Controller, Post, Request } from '@nestjs/common';
import { KeycloakResourcesService } from '../infrastructure/keycloak-resources.service';
import * as authRequest from '@open-dpp/auth';

@Controller('keycloak-resources')
export class KeycloakResourcesController {
  constructor(private keycloakResourcesService: KeycloakResourcesService) {}

  @Post()
  async create(@Request() req: authRequest.AuthRequest) {
    return this.keycloakResourcesService.createResource(
      req.authContext,
      'organization123',
      ['/organizations/123'],
    );
  }
}
