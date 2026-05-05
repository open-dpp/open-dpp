import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { UsersService } from "./application/services/users.service";
import { UsersRepository } from "./infrastructure/adapters/users.repository";
import { UserMapper } from "./infrastructure/mappers/user.mapper";
import { User, UserSchema } from "./infrastructure/schemas/user.schema";
import { UsersController } from "./presentation/users.controller";
import { InvitationsRepository } from "../organizations/infrastructure/adapters/invitations.repository";
import {
  InvitationDoc,
  InvitationSchema,
} from "../organizations/infrastructure/schemas/invitation.schema";
import {
  Organization,
  OrganizationSchema,
} from "../organizations/infrastructure/schemas/organization.schema";
import { OrganizationsRepository } from "../organizations/infrastructure/adapters/organizations.repository";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: InvitationDoc.name, schema: InvitationSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserMapper,
    UsersRepository,
    InvitationsRepository,
    OrganizationsRepository,
  ],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
