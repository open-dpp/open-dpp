import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EmailModule } from "../../email/email.module";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { OrganizationsService } from "./application/services/organizations.service";
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
  ],
  controllers: [OrganizationsController],
  providers: [
    OrganizationMapper,
    MemberMapper,
    OrganizationsRepository,
    MembersRepository,
    OrganizationsService,
  ],
  exports: [
    OrganizationsRepository,
    MembersRepository,
    OrganizationsService,
  ],
})
export class OrganizationsModule { }
