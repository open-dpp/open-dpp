import { Module } from "@nestjs/common";
import { EnvModule } from "@open-dpp/env";
import { KeycloakResourcesModule } from "../keycloak-resources/keycloak-resources.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { UsersModule } from "../users/users.module";
import { KeycloakSyncOnStartupService } from "./keycloak-sync-on-startup/keycloak-sync-on-startup.service";

@Module({
  imports: [
    OrganizationsModule,
    UsersModule,
    KeycloakResourcesModule,
    EnvModule,
  ],
  providers: [KeycloakSyncOnStartupService],
})
export class KeycloakSyncOnStartupModule {}
