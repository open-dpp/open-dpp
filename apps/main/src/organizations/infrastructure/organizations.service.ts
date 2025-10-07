import type { AuthContext } from "@open-dpp/auth";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { DataSource, Equal, Repository } from "typeorm";
import { KeycloakResourcesService } from "../../keycloak-resources/infrastructure/keycloak-resources.service";
import { User } from "../../users/domain/user";
import { UserEntity } from "../../users/infrastructure/user.entity";
import { UsersService } from "../../users/infrastructure/users.service";
import { Organization } from "../domain/organization";
import { OrganizationEntity } from "./organization.entity";

@Injectable()
export class OrganizationsService {
  private organizationRepository: Repository<OrganizationEntity>;
  private readonly dataSource: DataSource;
  private readonly keycloakResourcesService: KeycloakResourcesService;
  private readonly usersService: UsersService;

  constructor(
    @InjectRepository(OrganizationEntity)
    organizationRepository: Repository<OrganizationEntity>,
    @InjectDataSource()
    dataSource: DataSource,
    keycloakResourcesService: KeycloakResourcesService,
    usersService: UsersService,
  ) {
    this.organizationRepository = organizationRepository;
    this.dataSource = dataSource;
    this.keycloakResourcesService = keycloakResourcesService;
    this.usersService = usersService;
  }

  convertUserToEntity(user: User) {
    const userEntity = new UserEntity();
    userEntity.id = user.id;
    userEntity.email = user.email;
    return userEntity;
  }

  convertToDomain(organizationEntity: OrganizationEntity) {
    const members = organizationEntity.members
      ? organizationEntity.members.map(u => new User(u.id, u.email))
      : [];
    return Organization.fromPlain({
      id: organizationEntity.id,
      name: organizationEntity.name,
      members,
      createdByUserId: organizationEntity.createdByUserId,
      ownedByUserId: organizationEntity.ownedByUserId,
    });
  }

  async save(organization: Organization) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let result: Organization | null = null;
    try {
      await this.keycloakResourcesService.createGroup(organization);
      const members: Array<UserEntity> = organization.members.map(u =>
        this.convertUserToEntity(u),
      );
      const entity: Partial<OrganizationEntity> = {
        id: organization.id,
        name: organization.name,
        members,
        createdByUserId: organization.createdByUserId,
        ownedByUserId: organization.ownedByUserId,
      };
      const savedEntity = await this.organizationRepository.save(entity);
      await queryRunner.commitTransaction();
      result = this.convertToDomain(savedEntity);
    }
    catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }
    finally {
      await queryRunner.release();
    }
    return result;
  }

  async findAll() {
    return (
      await this.organizationRepository.find({
        relations: {
          members: true,
        },
      })
    ).map(o => this.convertToDomain(o));
  }

  async findOneOrFail(id: string) {
    const organizationEntity = await this.organizationRepository.findOne({
      where: { id: Equal(id) },
      relations: { members: true },
    });
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
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
      userToInvite = new User(keycloakUser.id, keycloakUser.email);
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
    try {
      org.members.push({ id: userToInvite.id, email: userToInvite.email });
      try {
        await queryRunner.manager.save(OrganizationEntity, org);
        await this.keycloakResourcesService.inviteUserToGroup(
          authContext,
          organizationId,
          userToInvite.id,
        );
        await queryRunner.commitTransaction();
      }
      catch {
        await queryRunner.rollbackTransaction();
      }
    }
    finally {
      await queryRunner.release();
    }
  }

  async findAllWhereMember(authContext: AuthContext) {
    return (
      await this.organizationRepository.find({
        where: {
          members: {
            id: Equal(authContext.keycloakUser.sub),
          },
        },
        relations: {
          members: true,
        },
      })
    ).map(o => this.convertToDomain(o));
  }
}
