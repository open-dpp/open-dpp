import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { KeycloakResourcesModule } from "../keycloak-resources/keycloak-resources.module";
import { UsersModule } from "../users/users.module";
import { OrganizationDbSchema, OrganizationDoc } from "./infrastructure/organization.schema";
import { OrganizationsService } from "./infrastructure/organizations.service";
import { OrganizationsController } from "./presentation/organizations.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: OrganizationDoc.name,
        schema: OrganizationDbSchema,
      },
    ]),
    KeycloakResourcesModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
