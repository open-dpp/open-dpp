import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule } from "@open-dpp/env";
import { EmailModule } from "../../email/email.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { UsersModule } from "../users/users.module";
import { GuestAccessService } from "./application/services/guest-access.service";
import { GuestAccessRepository } from "./infrastructure/adapters/guest-access.repository";
import { GuestAccessController } from "./presentation/guest-access.controller";
import { GuestAccess, GuestAccessSchema } from "./infrastructure/schemas/guest-access.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: GuestAccess.name, schema: GuestAccessSchema }]),
    EnvModule,
    EmailModule,
    OrganizationsModule,
    UsersModule,
  ],
  controllers: [GuestAccessController],
  providers: [GuestAccessRepository, GuestAccessService],
  exports: [GuestAccessService],
})
export class GuestAccessModule {}
