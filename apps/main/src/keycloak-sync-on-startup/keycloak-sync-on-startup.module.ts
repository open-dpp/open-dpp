import { Module } from '@nestjs/common';
import { KeycloakSyncOnStartupService } from './keycloak-sync-on-startup/keycloak-sync-on-startup.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { KeycloakResourcesModule } from '../keycloak-resources/keycloak-resources.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    OrganizationsModule,
    UsersModule,
    KeycloakResourcesModule,
    ConfigModule,
  ],
  providers: [KeycloakSyncOnStartupService],
})
export class KeycloakSyncOnStartupModule {}
