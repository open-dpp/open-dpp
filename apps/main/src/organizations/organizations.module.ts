import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";
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
    AuthModule,
    forwardRef(() => UsersModule),
    EmailModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
