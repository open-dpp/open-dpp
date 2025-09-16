import { Module } from '@nestjs/common';
import { KeycloakResourcesController } from './presentation/keycloak-resources.controller';
import { KeycloakResourcesService } from './infrastructure/keycloak-resources.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [KeycloakResourcesController],
  providers: [KeycloakResourcesService],
  exports: [KeycloakResourcesService],
})
export class KeycloakResourcesModule {}
