import { Module } from '@nestjs/common';
import { KeycloakResourcesController } from './presentation/keycloak-resources.controller';
import { KeycloakResourcesService } from './infrastructure/keycloak-resources.service';
import { HttpModule } from '@nestjs/axios';
import { EnvModule } from '@app/env/env.module';

@Module({
  imports: [HttpModule, EnvModule],
  controllers: [KeycloakResourcesController],
  providers: [KeycloakResourcesService],
  exports: [KeycloakResourcesService],
})
export class KeycloakResourcesModule {}
