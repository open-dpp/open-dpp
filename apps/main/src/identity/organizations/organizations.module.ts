import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EmailModule } from "../../email/email.module";
import { SessionsService } from "../auth/application/services/sessions.service";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { MembersService } from "./application/services/members.service";
import { OrganizationsService } from "./application/services/organizations.service";
import { InvitationsRepository } from "./infrastructure/adapters/invitations.repository";
import { MembersRepository } from "./infrastructure/adapters/members.repository";
import { OrganizationsRepository } from "./infrastructure/adapters/organizations.repository";
import { InvitationMapper } from "./infrastructure/mappers/invitation.mapper";
import { MemberMapper } from "./infrastructure/mappers/member.mapper";
import { OrganizationMapper } from "./infrastructure/mappers/organization.mapper";
import { Invitation, InvitationSchema } from "./infrastructure/schemas/invitation.schema";

import { Member, MemberSchema } from "./infrastructure/schemas/member.schema";
import { Organization, OrganizationSchema } from "./infrastructure/schemas/organization.schema";
import { OrganizationsController } from "./presentation/organizations.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Invitation.name, schema: InvitationSchema },
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    EmailModule,
  ],
  controllers: [OrganizationsController],
  providers: [
    OrganizationMapper,
    MemberMapper,
    InvitationMapper,
    OrganizationsRepository,
    MembersRepository,
    InvitationsRepository,
    OrganizationsService,
    MembersService,
    SessionsService,
  ],
  exports: [
    OrganizationsRepository,
    MembersRepository,
    OrganizationsService,
    MembersService,
  ],
})
export class OrganizationsModule { }

