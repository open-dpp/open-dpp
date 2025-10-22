import type { Model as MongooseModel } from "mongoose";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { AuthService, UserSession } from "@thallesp/nestjs-better-auth";
import { auth, getUserByEmail, getUserById } from "../../auth";
import { InviteUserToOrganizationMail } from "../../email/domain/invite-user-to-organization-mail";
import { EmailService } from "../../email/email.service";
import { User } from "../../users/domain/user";
import { UsersService } from "../../users/infrastructure/users.service";
import { Organization } from "../domain/organization";
import { OrganizationDoc, OrganizationSchemaVersion } from "./organization.schema";

@Injectable()
export class OrganizationsService {
  private organizationDoc: MongooseModel<OrganizationDoc>;
  private readonly usersService: UsersService;
  private readonly authService: AuthService<typeof auth>;
  private readonly emailService: EmailService;

  constructor(
    @InjectModel(OrganizationDoc.name)
    organizationDoc: MongooseModel<OrganizationDoc>,
    usersService: UsersService,
    authService: AuthService<typeof auth>,
    emailService: EmailService,
  ) {
    this.organizationDoc = organizationDoc;
    this.usersService = usersService;
    this.authService = authService;
    this.emailService = emailService;
  }

  async convertToDomain(
    orgDoc: OrganizationDoc,
  ) {
    // migrateItemDoc(itemDoc);
    const members = [];
    for (const member of orgDoc.members) {
      // const user = await this.usersService.findOne(member);
      const user = await getUserById(member);
      const userId = (user as unknown as { _id: string })._id;
      if (user) {
        members.push(User.loadFromDb({
          id: userId,
          email: user.email,
          keycloakUserId: userId,
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
    const userToInvite = await getUserByEmail(email);
    const userToInviteId = (userToInvite as unknown as { _id: string })._id;
    if (!userToInvite) {
      throw new NotFoundException(); // TODO: Fix user enumeration
    }
    if (org.members.find(member => member.id === userToInviteId)) {
      throw new BadRequestException();
    }
    org.members.push(User.loadFromDb({
      id: userToInviteId,
      email: userToInvite.email,
      keycloakUserId: userToInviteId,
    }));
    await this.save(org);
    await this.emailService.send(InviteUserToOrganizationMail.create({
      to: userToInvite.email,
      subject: "You've been invited to join an organization",
      templateProperties: {
        link: `http://localhost:5173/organizations/${org.id}`,
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
