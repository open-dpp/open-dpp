import type { AuthContext } from "@open-dpp/auth";
import type { Model as MongooseModel } from "mongoose";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { User } from "../../users/domain/user";
import { UsersService } from "../../users/infrastructure/users.service";
import { Organization } from "../domain/organization";
import { OrganizationDoc, OrganizationSchemaVersion } from "./organization.schema";

@Injectable()
export class OrganizationsService {
  private organizationDoc: MongooseModel<OrganizationDoc>;
  private readonly usersService: UsersService;

  constructor(
    @InjectModel(OrganizationDoc.name)
    organizationDoc: MongooseModel<OrganizationDoc>,
    usersService: UsersService,
  ) {
    this.organizationDoc = organizationDoc;
    this.usersService = usersService;
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
    const members = [];
    for (const member of organization.members) {
      const user = await this.usersService.findOne(member.id);
      if (user) {
        members.push(user?.id);
      }
    }
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
    const organizationEntity = await this.organizationDoc.findById(id).populate("members");
    if (!organizationEntity) {
      throw new NotFoundInDatabaseException(Organization.name);
    }
    return this.convertToDomain(organizationEntity);
  }

  async inviteUser(
    authContext: AuthContext,
    organizationId: string,
    email: string,
  ): Promise<void> {
    if (authContext.keycloakUser.email === email) {
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

  async findAllWhereMember(authContext: AuthContext) {
    const organizations = await this.organizationDoc.find({
      members: {
        $in: [authContext.user.id],
      },
    }).populate("members");
    const domainOrganizations = [];
    for (const organization of organizations) {
      const domain = await this.convertToDomain(organization);
      domainOrganizations.push(domain);
    }
    return domainOrganizations;
  }
}
