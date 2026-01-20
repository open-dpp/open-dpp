import { forwardRef, Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";
import { UsersModule } from "../users/users.module";
import { CreateOrganizationCommandHandler } from "./application/commands/create-organization.command-handler";
import { InviteMemberCommandHandler } from "./application/commands/invite-member.command-handler";
import { UpdateOrganizationCommandHandler } from "./application/commands/update-organization.command-handler";
import { GetMembersQueryHandler } from "./application/queries/get-members.query-handler";
import { GetOrganizationQueryHandler } from "./application/queries/get-organization.query-handler";
import { MembersRepositoryPort } from "./domain/ports/members.repository.port";
import { OrganizationsRepositoryPort } from "./domain/ports/organizations.repository.port";
import { MembersRepository } from "./infrastructure/adapters/members.repository";
import { OrganizationsRepository } from "./infrastructure/adapters/organizations.repository";
import { MemberMapper } from "./infrastructure/mappers/member.mapper";
import { OrganizationMapper } from "./infrastructure/mappers/organization.mapper";
import { Member, MemberSchema } from "./infrastructure/schemas/member.schema";
import { Organization, OrganizationSchema } from "./infrastructure/schemas/organization.schema";
import { OrganizationsController } from "./presentation/organizations.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
    AuthModule,
    forwardRef(() => UsersModule),
    EmailModule,
    CqrsModule,
  ],
  controllers: [OrganizationsController],
  providers: [
    OrganizationMapper,
    MemberMapper,
    {
      provide: OrganizationsRepositoryPort,
      useClass: OrganizationsRepository,
    },
    {
      provide: MembersRepositoryPort,
      useClass: MembersRepository,
    },
    CreateOrganizationCommandHandler,
    UpdateOrganizationCommandHandler,
    GetOrganizationQueryHandler,
    GetMembersQueryHandler,
    InviteMemberCommandHandler,
  ],
  exports: [OrganizationsRepositoryPort, MembersRepositoryPort],
})
export class OrganizationsModule { }
