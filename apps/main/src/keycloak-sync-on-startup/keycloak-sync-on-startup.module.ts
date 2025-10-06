import { Module } from '@nestjs/common';
import { KeycloakSyncOnStartupService } from './keycloak-sync-on-startup/keycloak-sync-on-startup.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { KeycloakResourcesModule } from '../keycloak-resources/keycloak-resources.module';
import { EnvModule } from '@app/env/env.module';

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
