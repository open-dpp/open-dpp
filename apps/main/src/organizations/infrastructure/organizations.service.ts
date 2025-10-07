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
import { Equal } from "typeorm";
import { ItemDocSchemaVersion } from "../../items/infrastructure/item.schema";
import { KeycloakResourcesService } from "../../keycloak-resources/infrastructure/keycloak-resources.service";
import { User } from "../../users/domain/user";
import { UserEntity } from "../../users/infrastructure/user.entity";
import { UsersService } from "../../users/infrastructure/users.service";
import { Organization } from "../domain/organization";
import { OrganizationDoc } from "./organization.schema";

@Injectable()
export class OrganizationsService {
  private organizationDoc: MongooseModel<OrganizationDoc>;
  private readonly keycloakResourcesService: KeycloakResourcesService;
  private readonly usersService: UsersService;

  constructor(
    @InjectModel(OrganizationDoc.name)
    organizationDoc: MongooseModel<OrganizationDoc>,
    keycloakResourcesService: KeycloakResourcesService,
    usersService: UsersService,
  ) {
    this.organizationDoc = organizationDoc;
    this.keycloakResourcesService = keycloakResourcesService;
    this.usersService = usersService;
  }

  convertUserToEntity(user: User) {
    const userEntity = new UserEntity();
    userEntity.id = user.id;
    userEntity.email = user.email;
    return userEntity;
  }

  convertToDomain(
    orgDoc: OrganizationDoc,
  ) {
    // migrateItemDoc(itemDoc);
    return Organization.loadFromDb({
      id: orgDoc.id,
      name: orgDoc.name,
      createdByUserId: orgDoc.createdByUserId,
      ownedByUserId: orgDoc.ownedByUserId,
      members: orgDoc.members.map(member => User.loadFromDb({
        id: member,
        email: member, // TODO fetch real user
      })),
    });
  }

  async save(organization: Organization) {
    await this.keycloakResourcesService.createGroup(organization);
    const entity = await this.organizationDoc.findOneAndUpdate(
      { _id: organization.id },
      {
        $set: {
          _schemaVersion: ItemDocSchemaVersion.v1_0_2,
          name: organization.name,
          createdByUserId: organization.createdByUserId,
          ownedByUserId: organization.ownedByUserId,
          members: organization.members.map(member => ({
            id: member.id,
            email: member.email,
          })),
        },
        $unset: {
          productDataModelId: 1,
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

  async findAll() {
    return (
      await this.organizationDoc.find().populate("members")
    ).map(o => this.convertToDomain(o));
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
    const users = await this.usersService.find({
      where: { email: Equal(email) },
    });
    if (users.length > 1) {
      throw new InternalServerErrorException();
    }
    let userToInvite: User | null = null;
    if (users.length === 0) {
      const keycloakUser
        = await this.keycloakResourcesService.findKeycloakUserByEmail(email);
      if (!keycloakUser || !keycloakUser.id || !keycloakUser.email) {
        throw new NotFoundException();
      }
      userToInvite = User.create({
        email: keycloakUser.email,
      });
    }
    else if (users.length === 1) {
      userToInvite = users[0];
    }
    if (!userToInvite) {
      throw new NotFoundException(); // TODO: Fix user enumeration
    }
    if (org.members.find(member => member.id === userToInvite.id)) {
      throw new BadRequestException();
    }
    org.members.push({ id: userToInvite.id, email: userToInvite.email });
    await this.save(org);
    await this.keycloakResourcesService.inviteUserToGroup(
      authContext,
      organizationId,
      userToInvite.id,
    );
  }

  async findAllWhereMember(authContext: AuthContext) {
    return (
      await this.organizationDoc.find({
        members: {
          $elemMatch: {
            id: authContext.keycloakUser.sub,
          },
        },
      }).populate("members")
    ).map(o => this.convertToDomain(o));
  }
}
