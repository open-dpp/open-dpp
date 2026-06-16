import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
import { EmailModule } from "../../email/email.module";
import { AuthModule } from "../auth/auth.module";
import { EmailChangeRequestsModule } from "../email-change-requests/email-change-requests.module";
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
    // Throttling is scoped to this module's sensitive endpoint (POST /users/me/email-change),
    // which opts in via `@UseGuards(UserOrIpThrottlerGuard)` + `@Throttle(...)`. Registering it
    // here (not globally in AppModule) keeps the throttler available to every UsersModule consumer
    // — including isolated test modules — and leaves all other endpoints unthrottled.
    // ThrottlerModule is @Global, so this single registration still serves the whole app.
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 1000 }]),
    forwardRef(() => AuthModule),
    EmailChangeRequestsModule,
    EmailModule,
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
