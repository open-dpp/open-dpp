import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { TypeOrmTestingModule } from '../../../test/typeorm.testing.module';
import { UserEntity } from '../../users/infrastructure/user.entity';
import { OrganizationEntity } from './organization.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { v4 as uuid4 } from 'uuid';
import { DataSource } from 'typeorm';
import { Organization } from '../domain/organization';
import { randomUUID } from 'crypto';
import { User } from '../../users/domain/user';
import { AuthContext } from '../../auth/auth-request';
import { KeycloakResourcesService } from '../../keycloak-resources/infrastructure/keycloak-resources.service';
import { KeycloakResourcesServiceTesting } from '../../../test/keycloak.resources.service.testing';
import { UsersService } from '../../users/infrastructure/users.service';
import { NotFoundInDatabaseException } from '../../exceptions/service.exceptions';
import { PermissionsModule } from '../../permissions/permissions.module';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('OrganizationsService', () => {
  let organizationsService: OrganizationsService;
  let usersService: UsersService;
  let keycloakResourcesService: KeycloakResourcesServiceTesting;
  let dataSource: DataSource;
  const authContext = new AuthContext();
  const userId = randomUUID();
  authContext.user = new User(userId, 'test@test.test');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmTestingModule,
        TypeOrmModule.forFeature([OrganizationEntity, UserEntity]),
        PermissionsModule,
      ],
      providers: [OrganizationsService, UsersService, KeycloakResourcesService],
    })
      .overrideProvider(KeycloakResourcesService)
      .useValue(
        KeycloakResourcesServiceTesting.fromPlain({
          users: [
            { id: authContext.user.id, email: authContext.user.email },
            { id: randomUUID(), email: 'other@test.test' },
          ],
        }),
      )
      .overrideProvider(UsersService)
      .useValue({
        find: jest.fn(),
        findOne: jest.fn(),
        convertToDomain: jest.fn((entity) => new User(entity.id, entity.email)),
      })
      .compile();

    organizationsService =
      module.get<OrganizationsService>(OrganizationsService);
    usersService = module.get<UsersService>(UsersService);
    keycloakResourcesService = module.get<KeycloakResourcesService>(
      KeycloakResourcesService,
    ) as unknown as KeycloakResourcesServiceTesting;
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('convertUserToEntity', () => {
    it('should convert a user domain object to entity', () => {
      const user = new User('test-id', 'test@example.com');
      const userEntity = organizationsService.convertUserToEntity(user);

      expect(userEntity).toBeInstanceOf(UserEntity);
      expect(userEntity.id).toBe('test-id');
      expect(userEntity.email).toBe('test@example.com');
    });
  });

  describe('convertToDomain', () => {
    it('should convert organization entity to domain object', () => {
      const orgEntity = new OrganizationEntity();
      orgEntity.id = 'org-id';
      orgEntity.name = 'Test Organization';
      orgEntity.createdByUserId = 'creator-id';
      orgEntity.ownedByUserId = 'owner-id';

      // Add members
      const member1 = new UserEntity();
      member1.id = 'member1';
      member1.email = 'member1@example.com';

      const member2 = new UserEntity();
      member2.id = 'member2';
      member2.email = 'member2@example.com';

      orgEntity.members = [member1, member2];

      const organization = organizationsService.convertToDomain(orgEntity);

      expect(organization).toBeInstanceOf(Organization);
      expect(organization.id).toBe('org-id');
      expect(organization.name).toBe('Test Organization');
      expect(organization.createdByUserId).toBe('creator-id');
      expect(organization.ownedByUserId).toBe('owner-id');
      expect(organization.members).toHaveLength(2);
      expect(organization.members[0]).toBeInstanceOf(User);
      expect(organization.members[0].id).toBe('member1');
      expect(organization.members[1].id).toBe('member2');
    });

    it('should handle organization entity without members', () => {
      const orgEntity = new OrganizationEntity();
      orgEntity.id = 'org-id';
      orgEntity.name = 'Test Organization';
      orgEntity.createdByUserId = 'creator-id';
      orgEntity.ownedByUserId = 'owner-id';
      orgEntity.members = undefined;

      const organization = organizationsService.convertToDomain(orgEntity);

      expect(organization.members).toEqual([]);
    });
  });

  describe('save', () => {
    it('should create an organization', async () => {
      const name = `My Organization ${uuid4()}`;
      const organization = Organization.create({
        name,
        user: authContext.user,
      });
      const { id } = await organizationsService.save(organization);
      const found = await organizationsService.findOneOrFail(id);

      expect(found.name).toEqual(name);
      expect(found.createdByUserId).toEqual(organization.createdByUserId);
    });

    it('should handle transaction error during create group', async () => {
      const name = `My Organization ${uuid4()}`;
      const organization = Organization.create({
        name,
        user: authContext.user,
      });

      // Mock the keycloakResourcesService to throw an error
      jest
        .spyOn(keycloakResourcesService, 'createGroup')
        .mockRejectedValueOnce(new Error('Test error'));

      await expect(organizationsService.save(organization)).rejects.toThrow(
        'Test error',
      );
    });

    it('should add members to organization', async () => {
      const name = `My Organization ${uuid4()}`;
      Organization.create({
        name,
        user: authContext.user,
      });
    });

    it('fails if requested organization could not be found', async () => {
      await expect(
        organizationsService.findOneOrFail(randomUUID()),
      ).rejects.toThrow(new NotFoundInDatabaseException(Organization.name));
    });

    it('should add members to organization', async () => {
      const name = `My Organization ${uuid4()}`;
      const organization = Organization.create({
        name,
        user: authContext.user,
      });

      const user2 = new User(randomUUID(), 'test2@test.test');
      organization.join(authContext.user);
      organization.join(user2);
      await organizationsService.save(organization);
      const found = await organizationsService.findOneOrFail(organization.id);

      expect(found.members).toHaveLength(2);
      expect(found.members.map((m) => m.id)).toContain(authContext.user.id);
      expect(found.members.map((m) => m.id)).toContain(user2.id);
    });

    it('should handle transaction error during database save', async () => {
      const name = `My Organization ${uuid4()}`;
      const organization = Organization.create({
        name,
        user: authContext.user,
      });

      // Create spy for transaction methods
      const queryRunnerConnectSpy = jest.spyOn(dataSource, 'createQueryRunner');
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };
      queryRunnerConnectSpy.mockReturnValue(mockQueryRunner as any);

      // Mock the repository to throw an error
      jest
        .spyOn(organizationsService['organizationRepository'], 'save')
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(organizationsService.save(organization)).rejects.toThrow(
        'Database error',
      );

      // Verify transaction was rolled back
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      // Clean up spies
      queryRunnerConnectSpy.mockRestore();
    });

    describe('findAll', () => {
      it('should return all organizations', async () => {
        // Create some test organizations
        const org1 = Organization.create({
          name: 'Org 1',
          user: authContext.user,
        });
        const org2 = Organization.create({
          name: 'Org 2',
          user: authContext.user,
        });

        await organizationsService.save(org1);
        await organizationsService.save(org2);

        const organizations = await organizationsService.findAll();

        expect(organizations.length).toBeGreaterThanOrEqual(2);
        expect(organizations.map((o) => o.name)).toContain('Org 1');
        expect(organizations.map((o) => o.name)).toContain('Org 2');
      });

      it('should return empty array when no organizations exist', async () => {
        // Mock repository to return empty array
        jest
          .spyOn(organizationsService['organizationRepository'], 'find')
          .mockResolvedValueOnce([]);

        const organizations = await organizationsService.findAll();

        expect(organizations).toEqual([]);
      });

      it('should handle database error', async () => {
        // Mock repository to throw an error
        jest
          .spyOn(organizationsService['organizationRepository'], 'find')
          .mockRejectedValueOnce(new Error('Database connection error'));

        await expect(organizationsService.findAll()).rejects.toThrow(
          'Database connection error',
        );
      });
    });

    describe('findOne', () => {
      it('should return an organization by id', async () => {
        const name = `organization-${uuid4()}`;
        const organization = Organization.create({
          name,
          user: authContext.user,
        });
        const saved = await organizationsService.save(organization);

        const found = await organizationsService.findOneOrFail(saved.id);

        expect(found).toBeDefined();
        expect(found.id).toBe(saved.id);
        expect(found.name).toBe(name);
      });

      it('should include models relation when finding organization', async () => {
        const name = `Test Org with Models ${uuid4()}`;
        const organization = Organization.create({
          name,
          user: authContext.user,
        });
        const saved = await organizationsService.save(organization);

        // Mock repository to return organization with models property
        const orgEntity = new OrganizationEntity();
        orgEntity.id = saved.id;
        orgEntity.name = name;
        orgEntity.members = [];

        jest
          .spyOn(organizationsService['organizationRepository'], 'findOne')
          .mockResolvedValueOnce(orgEntity);

        const found = await organizationsService.findOneOrFail(saved.id);

        expect(found).toBeDefined();
        expect(found.id).toBe(saved.id);
      });

      it('fails if requested organization could not be found', async () => {
        await expect(
          organizationsService.findOneOrFail(randomUUID()),
        ).rejects.toThrow(new NotFoundInDatabaseException(Organization.name));
      });
    });

    describe('inviteUser', () => {
      let organization: Organization;

      beforeEach(async () => {
        const name = `tobeset`;
        organization = Organization.create({ name, user: authContext.user });
        await organizationsService.save(organization);
        keycloakResourcesService.groups.push({
          id: organization.id,
          name: organization.name,
          members: organization.members,
        });
      });

      it('should throw BadRequestException when inviting yourself', async () => {
        await expect(
          organizationsService.inviteUser(
            authContext,
            organization.id,
            authContext.user.email,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw InternalServerException when multiple users with same email', async () => {
        const email = 'duplicate@test.test';

        // Mock the UsersService to return multiple users with the same email
        jest
          .spyOn(usersService, 'find')
          .mockResolvedValueOnce([
            new User('user1', email),
            new User('user2', email),
          ]);

        await expect(
          organizationsService.inviteUser(authContext, organization.id, email),
        ).rejects.toThrow(InternalServerErrorException);
      });

      it('should invite existing user to organization', async () => {
        const newUserEmail = 'newuser@test.test';
        const newUserId = randomUUID();
        const newUser = new User(newUserId, newUserEmail);

        // Mock the UsersService to return one user
        jest.spyOn(usersService, 'find').mockResolvedValueOnce([newUser]);

        // Mock group retrieval for the invite
        jest
          .spyOn(keycloakResourcesService, 'inviteUserToGroup')
          .mockResolvedValueOnce(undefined);

        await organizationsService.inviteUser(
          authContext,
          organization.id,
          newUserEmail,
        );

        // Verify the user was added to the organization
        const updatedOrg = await organizationsService.findOneOrFail(
          organization.id,
        );
        expect(updatedOrg.members.map((m) => m.email)).toContain(newUserEmail);
      });

      it('should invite keycloak user not yet in database', async () => {
        const newUserEmail = 'keycloakuser@test.test';
        const newUserId = randomUUID();

        // Add the user to the keycloak mock
        keycloakResourcesService.users.push({
          id: newUserId,
          email: newUserEmail,
        });
        keycloakResourcesService.groups.push({
          id: organization.id,
          name: organization.id,
          members: organization.members,
        });

        // Mock the UsersService to return no users
        jest.spyOn(usersService, 'find').mockResolvedValueOnce([]);

        await organizationsService.inviteUser(
          authContext,
          organization.id,
          newUserEmail,
        );

        // Verify the user was added to the organization
        const updatedOrg = await organizationsService.findOneOrFail(
          organization.id,
        );
        expect(updatedOrg.members.map((m) => m.email)).toContain(newUserEmail);
      });

      it('should throw BadRequestException when user is already a member', async () => {
        const existingMemberEmail = 'existing@test.test';
        const existingMemberId = randomUUID();
        const existingMember = new User(existingMemberId, existingMemberEmail);

        // Add member to organization
        organization.join(existingMember);
        await organizationsService.save(organization);

        // Mock the UsersService to return the existing member
        jest
          .spyOn(usersService, 'find')
          .mockResolvedValueOnce([existingMember]);

        await expect(
          organizationsService.inviteUser(
            authContext,
            organization.id,
            existingMemberEmail,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('should handle error during invitation process', async () => {
        const newUserEmail = 'error@test.test';
        const newUserId = randomUUID();
        const newUser = new User(newUserId, newUserEmail);

        // Mock the UsersService to return one user
        jest.spyOn(usersService, 'find').mockResolvedValueOnce([newUser]);

        // Mock group retrieval for the invite to throw an error
        const mockError = new Error('Test error');
        jest
          .spyOn(keycloakResourcesService, 'inviteUserToGroup')
          .mockRejectedValueOnce(mockError);

        // Mock console.log to verify it's called
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await organizationsService.inviteUser(
          authContext,
          organization.id,
          newUserEmail,
        );

        // Verify error was logged
        expect(consoleSpy).toHaveBeenCalledWith('Error:', mockError);

        consoleSpy.mockRestore();
      });

      it('should handle transaction rollback when organization repository save fails', async () => {
        const newUserEmail = 'rollback@test.test';
        const newUserId = randomUUID();
        const newUser = new User(newUserId, newUserEmail);

        // Mock findOne to return a valid organization to avoid the query issue
        const mockOrg = Organization.fromPlain({
          id: organization.id,
          name: 'Test Org',
          members: [],
          createdByUserId: authContext.user.id,
          ownedByUserId: authContext.user.id,
        });
        jest
          .spyOn(organizationsService, 'findOneOrFail')
          .mockResolvedValueOnce(mockOrg);

        // Mock the UsersService to return one user
        jest.spyOn(usersService, 'find').mockResolvedValueOnce([newUser]);

        // Create spy for transaction methods
        const queryRunnerConnectSpy = jest.spyOn(
          dataSource,
          'createQueryRunner',
        );
        const mockQueryRunner = {
          connect: jest.fn(),
          startTransaction: jest.fn(),
          commitTransaction: jest.fn(),
          rollbackTransaction: jest.fn(),
          release: jest.fn(),
          manager: {
            save: jest.fn().mockImplementation(() => {
              throw new Error('Database error');
            }),
          },
          query: jest.fn(),
        };
        queryRunnerConnectSpy.mockReturnValue(mockQueryRunner as any);

        // Mock console.log to verify it's called
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await organizationsService.inviteUser(
          authContext,
          organization.id,
          newUserEmail,
        );

        // Verify transaction was rolled back
        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();

        // Clean up spies
        queryRunnerConnectSpy.mockRestore();
        consoleSpy.mockRestore();
      });

      it('should throw NotFoundException when organization not found', async () => {
        const nonExistentOrgId = randomUUID();

        // Mock findOne to throw NotFoundInDatabaseException
        jest
          .spyOn(organizationsService, 'findOneOrFail')
          .mockRejectedValueOnce(
            new NotFoundInDatabaseException(Organization.name),
          );

        await expect(
          organizationsService.inviteUser(
            authContext,
            nonExistentOrgId,
            'test@example.com',
          ),
        ).rejects.toThrow(NotFoundInDatabaseException);
      });
    });

    describe('findAllWhereMember', () => {
      it('should return all organizations where user is a member', async () => {
        // Create test organizations with different members
        const org1 = Organization.create({
          name: 'Member Org',
          user: authContext.user,
        });
        const org2 = Organization.create({
          name: 'Non-Member Org',
          user: new User(randomUUID(), 'other@test.test'),
        });

        await organizationsService.save(org1);
        await organizationsService.save(org2);

        const userOrganizations =
          await organizationsService.findAllWhereMember(authContext);

        // Verify that only the organizations where the user is a member are returned
        expect(userOrganizations.some((o) => o.name === 'Member Org')).toBe(
          true,
        );
        expect(
          userOrganizations.every((o) => o.name !== 'Non-Member Org'),
        ).toBe(true);
      });

      it('should return empty array when user is not a member of any organization', async () => {
        // Create a new auth context with a user that's not a member of any org
        const newAuthContext = new AuthContext();
        const newUserId = randomUUID();
        newAuthContext.user = new User(newUserId, 'nonmember@test.test');

        // Mock repository to return empty array
        jest
          .spyOn(organizationsService['organizationRepository'], 'find')
          .mockResolvedValueOnce([]);

        const userOrganizations =
          await organizationsService.findAllWhereMember(newAuthContext);

        expect(userOrganizations).toEqual([]);
      });

      it('should handle database error', async () => {
        // Mock repository to throw an error
        jest
          .spyOn(organizationsService['organizationRepository'], 'find')
          .mockRejectedValueOnce(new Error('Database connection error'));

        await expect(
          organizationsService.findAllWhereMember(authContext),
        ).rejects.toThrow('Database connection error');
      });

      it('should filter organizations correctly based on user id', async () => {
        // Create multiple organizations
        const org1 = Organization.create({
          name: 'Org 1',
          user: authContext.user,
        });
        const org2 = Organization.create({
          name: 'Org 2',
          user: authContext.user,
        });
        const org3 = Organization.create({
          name: 'Org 3',
          user: new User(randomUUID(), 'other@test.test'),
        });

        // Add current user to org1 and org2 but not org3
        org1.join(authContext.user);
        org2.join(authContext.user);

        await organizationsService.save(org1);
        await organizationsService.save(org2);
        await organizationsService.save(org3);

        const userOrganizations =
          await organizationsService.findAllWhereMember(authContext);

        // Should contain org1 and org2 but not org3
        expect(userOrganizations.length).toBeGreaterThanOrEqual(2);
        expect(userOrganizations.some((o) => o.name === 'Org 1')).toBe(true);
        expect(userOrganizations.some((o) => o.name === 'Org 2')).toBe(true);
        expect(userOrganizations.every((o) => o.name !== 'Org 3')).toBe(true);
      });
    });
    afterEach(async () => {
      await dataSource.destroy();
    });
  });
});
