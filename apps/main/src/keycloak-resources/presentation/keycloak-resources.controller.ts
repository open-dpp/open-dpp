import type * as authRequest from '@open-dpp/auth'
import type { KeycloakResourcesService } from '../infrastructure/keycloak-resources.service'
import { Controller, Post, Request } from '@nestjs/common'

@Controller('keycloak-resources')
export class KeycloakResourcesController {
  private keycloakResourcesService: KeycloakResourcesService

  constructor(keycloakResourcesService: KeycloakResourcesService) {
    this.keycloakResourcesService = keycloakResourcesService
  }

  @Post()
  async create(@Request() req: authRequest.AuthRequest) {
    return this.keycloakResourcesService.createResource(
      req.authContext,
      'organization123',
      ['/organizations/123'],
    )
  }
}
