import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { KeycloakResourcesService } from './infrastructure/keycloak-resources.service'
import { KeycloakResourcesController } from './presentation/keycloak-resources.controller'

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [KeycloakResourcesController],
  providers: [KeycloakResourcesService],
  exports: [KeycloakResourcesService],
})
export class KeycloakResourcesModule {}
