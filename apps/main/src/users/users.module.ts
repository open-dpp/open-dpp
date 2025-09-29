import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './infrastructure/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infrastructure/user.entity';
import { OrganizationsModule } from '../organizations/organizations.module';
import { KeycloakResourcesModule } from '../keycloak-resources/keycloak-resources.module';
import { KeycloakSyncOnStartupService } from '../keycloak-sync-on-startup/keycloak-sync-on-startup/keycloak-sync-on-startup.service';
import { CreateNonExistingUserGuard } from './infrastructure/create-non-existing-user.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    forwardRef(() => OrganizationsModule),
    KeycloakResourcesModule,
  ],
  controllers: [],
  providers: [
    UsersService,
    KeycloakSyncOnStartupService,
    CreateNonExistingUserGuard,
  ],
  exports: [UsersService, CreateNonExistingUserGuard],
})
export class UsersModule {}
