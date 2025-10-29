import type { Model as MongooseModel } from "mongoose";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { UserSession } from "../../auth/auth.guard";
import { AuthService } from "../../auth/auth.service";
import { InviteUserToOrganizationMail } from "../../email/domain/invite-user-to-organization-mail";
import { EmailService } from "../../email/email.service";
import { User } from "../../users/domain/user";
import { Organization } from "../domain/organization";
import { OrganizationDoc, OrganizationSchemaVersion } from "./organization.schema";

@Injectable()
export class OrganizationsService {
  private organizationDoc: MongooseModel<OrganizationDoc>;
  private readonly emailService: EmailService;
  private readonly authService: AuthService;
  private readonly configService: EnvService;

  constructor(
    @InjectModel(OrganizationDoc.name)
    organizationDoc: MongooseModel<OrganizationDoc>,
    emailService: EmailService,
    authService: AuthService,
    configService: EnvService,
  ) {
    this.organizationDoc = organizationDoc;
    this.emailService = emailService;
    this.authService = authService;
    this.configService = configService;
  }

  async convertToDomain(
    orgDoc: OrganizationDoc,
  ) {
    // migrateItemDoc(itemDoc);
    const members = [];
    for (const member of orgDoc.members) {
      // const user = await this.usersService.findOne(member);
      const user = await this.authService.getUserById(member);
      if (user) {
        const userId = (user as unknown as { _id: string })._id;
        members.push(User.loadFromDb({
          id: userId,
          email: user.email,
        }));
      }
    }
    return Organization.loadFromDb({
      id: orgDoc.id,
      name: orgDoc.name,
      createdByUserId: orgDoc.createdByUserId,
      ownedByUserId: orgDoc.ownedByUserId,
      members,
    });
  }

  async save(organization: Organization) {
    const members: string[] = organization.members.map(member => member.id);
    const entity = await this.organizationDoc.findOneAndUpdate(
      { _id: organization.id },
      {
        $set: {
          _schemaVersion: OrganizationSchemaVersion.v1_0_0,
          name: organization.name,
          createdByUserId: organization.createdByUserId,
          ownedByUserId: organization.ownedByUserId,
          members,
        },
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if none found
        runValidators: true,
      },
    );
    return this.convertToDomain(entity);
  }

  async findOneOrFail(id: string) {
    const organizationEntity = await this.organizationDoc.findById(id);
    if (!organizationEntity) {
      throw new NotFoundInDatabaseException(Organization.name);
    }
    return this.convertToDomain(organizationEntity);
  }

  async inviteUser(
    session: UserSession,
    organizationId: string,
    email: string,
  ): Promise<void> {
    if (session.user.email === email) {
      throw new BadRequestException();
    }
    const org = await this.findOneOrFail(organizationId);
    const userToInvite = await this.authService.getUserByEmail(email);
    if (!userToInvite) {
      throw new NotFoundException(); // TODO: Fix user enumeration
    }
    const userToInviteId = (userToInvite as unknown as { _id: string })._id;
    if (org.members.find(member => member.id === userToInviteId)) {
      throw new BadRequestException();
    }
    org.members.push(User.loadFromDb({
      id: userToInviteId,
      email: userToInvite.email,
    }));
    await this.save(org);
    await this.emailService.send(InviteUserToOrganizationMail.create({
      to: userToInvite.email,
      subject: "You've been invited to join an organization",
      templateProperties: {
        link: `${this.configService.get("OPEN_DPP_URL")}/organizations/${org.id}`,
        organizationName: org.name,
        firstName: userToInvite.name,
      },
    }));
  }

  async findAllWhereMember(user: User) {
    const organizations = await this.organizationDoc.find({
      members: {
        $in: [user.id],
      },
    });
    const domainOrganizations = [];
    for (const organization of organizations) {
      const domain = await this.convertToDomain(organization);
      domainOrganizations.push(domain);
    }
    return domainOrganizations;
  }
}
