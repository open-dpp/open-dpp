import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { EnvModule } from "@open-dpp/env";
import { KeycloakResourcesService } from "./infrastructure/keycloak-resources.service";

@Module({
  imports: [HttpModule, EnvModule],
  controllers: [],
  providers: [KeycloakResourcesService],
  exports: [KeycloakResourcesService],
})
export class KeycloakResourcesModule {}
