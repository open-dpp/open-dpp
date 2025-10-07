import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KeycloakResourcesModule } from "../keycloak-resources/keycloak-resources.module";
import { KeycloakSyncOnStartupService } from "../keycloak-sync-on-startup/keycloak-sync-on-startup/keycloak-sync-on-startup.service";
import { OrganizationsModule } from "../organizations/organizations.module";
import { CreateNonExistingUserGuard } from "./infrastructure/create-non-existing-user.guard";
import { UserEntity } from "./infrastructure/user.entity";
import { UsersService } from "./infrastructure/users.service";

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
