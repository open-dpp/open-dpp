import type { Model as MongooseModel } from "mongoose";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { AuthService, UserSession } from "@thallesp/nestjs-better-auth";
import { auth } from "../../auth";
import { User } from "../../users/domain/user";
import { UsersService } from "../../users/infrastructure/users.service";
import { Organization } from "../domain/organization";
import { OrganizationDoc, OrganizationSchemaVersion } from "./organization.schema";

@Injectable()
export class OrganizationsService {
  private organizationDoc: MongooseModel<OrganizationDoc>;
  private readonly usersService: UsersService;
  private readonly authService: AuthService<typeof auth>;

  constructor(
    @InjectModel(OrganizationDoc.name)
    organizationDoc: MongooseModel<OrganizationDoc>,
    usersService: UsersService,
    authService: AuthService<typeof auth>,
  ) {
    this.organizationDoc = organizationDoc;
    this.usersService = usersService;
    this.authService = authService;
  }

  async convertToDomain(
    orgDoc: OrganizationDoc,
  ) {
    // migrateItemDoc(itemDoc);
    const members = [];
    for (const member of orgDoc.members) {
      const user = await this.usersService.findOne(member);
      if (user) {
        members.push(User.loadFromDb({
          id: user.id,
          email: user.email,
          keycloakUserId: user.keycloakUserId,
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
    const users = await this.usersService.findByEmail(email);
    if (users.length > 1) {
      throw new InternalServerErrorException();
    }
    const userToInvite: User = users[0];
    if (!userToInvite) {
      throw new NotFoundException(); // TODO: Fix user enumeration
    }
    if (org.members.find(member => member.id === userToInvite.id)) {
      throw new BadRequestException();
    }
    org.members.push(userToInvite);
    await this.save(org);
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
