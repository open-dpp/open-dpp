import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { KeycloakResourcesModule } from "../keycloak-resources/keycloak-resources.module";
import { KeycloakSyncOnStartupService } from "../keycloak-sync-on-startup/keycloak-sync-on-startup/keycloak-sync-on-startup.service";
import { OrganizationsModule } from "../organizations/organizations.module";
import { CreateNonExistingUserGuard } from "./infrastructure/create-non-existing-user.guard";
import { UserDbSchema, UserDoc } from "./infrastructure/user.schema";
import { UsersService } from "./infrastructure/users.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UserDoc.name,
        schema: UserDbSchema,
      },
    ]),
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
