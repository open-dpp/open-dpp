import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakResourcesService } from './keycloak-resources.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { User } from '../../users/domain/user';
import { Organization } from '../../organizations/domain/organization';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { expect } from '@jest/globals';
import { AuthContext } from '@app/auth/auth-request';
import { createKeycloakUserInToken } from '@app/testing/users-and-orgs';
import { EnvModule, EnvService } from '@app/env';

jest.mock('@keycloak/keycloak-admin-client', () => {
  return {
    __esModule: true, // Ensure Jest understands it's an ES module
    default: jest.fn(() => ({
      auth: jest.fn(),
      users: {
        find: jest.fn(),
        findOne: jest.fn(),
        listGroups: jest.fn(),
        addToGroup: jest.fn(),
        create: jest.fn(),
      },
      groups: {
        create: jest.fn(),
        find: jest.fn(),
        del: jest.fn(),
      },
      clients: {
        createResource: jest.fn(),
      },
    })),
  };
});

describe('KeycloakResourcesService', () => {
  let service: KeycloakResourcesService;
  let mockKcAdminClient: any;
  let mockConfigService: Partial<ConfigService>;

  const authContext = new AuthContext();
  authContext.keycloakUser = createKeycloakUserInToken();

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key) => {
        if (key === 'OPEN_DPP_KEYCLOAK_URL') return 'http://localhost:8080';
        if (key === 'OPEN_DPP_KEYCLOAK_REALM') return 'master';
        if (key === 'OPEN_DPP_KEYCLOAK_USER') return 'admin';
        if (key === 'OPEN_DPP_KEYCLOAK_PASSWORD') return 'admin';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, EnvModule],
      providers: [
        KeycloakResourcesService,
        {
          provide: EnvService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<KeycloakResourcesService>(KeycloakResourcesService);
    mockKcAdminClient = (service as any).kcAdminClient;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reloadToken', () => {
    it('should authenticate with keycloak admin', async () => {
      await service.reloadToken();

      expect(mockKcAdminClient.auth).toHaveBeenCalledWith({
        grantType: 'password',
        clientId: 'admin-cli',
        username: 'admin',
        password: 'admin',
      });
    });
  });

  describe('createResource', () => {
    it('should create a keycloak resource', async () => {
      const resourceName = 'test-resource';
      const uris = ['/test/123'];

      await service.createResource(authContext, resourceName, uris);

      expect(mockKcAdminClient.auth).toHaveBeenCalled();
      expect(mockKcAdminClient.clients.createResource).toHaveBeenCalledWith(
        {
          id: 'backend',
          realm: 'master',
        },
        {
          name: resourceName,
          type: `urn:backend:${resourceName}`,
          uris,
          ownerManagedAccess: true,
          attributes: {
            owner: [authContext.keycloakUser.sub],
          },
          scopes: [
            {
              name: 'read',
            },
          ],
        },
      );
    });
  });

  describe('createGroup', () => {
    it('should create a group for an organization', async () => {
      const user = new User(randomUUID(), 'test@test.test');
      const organization = Organization.create({ name: 'Test Org', user });
      const member1 = new User(randomUUID(), 'member1@test.test');
      organization.join(member1);

      // Mock the createGroup response
      mockKcAdminClient.groups.create.mockResolvedValue({ id: 'group-id' });

      await service.createGroup(organization);

      expect(mockKcAdminClient.auth).toHaveBeenCalled();
      expect(mockKcAdminClient.groups.create).toHaveBeenCalledWith({
        name: `organization-${organization.id}`,
        realm: 'master',
      });

      // The addToGroup would be called for members
      expect(mockKcAdminClient.users.addToGroup).toHaveBeenCalled();
    });

    it('should handle the edge cases when creator and owner differ from members', async () => {
      // For testing the edge cases in createGroup where owner/creator aren't in members list
      // Use the spy approach instead of trying to modify readonly properties

      const creatorId = 'creator-id';
      const ownerId = 'owner-id';

      // Create a mock organization object with the necessary property stubs
      const mockOrganization = {
        id: 'test-org-id',
        createdByUserId: creatorId,
        ownedByUserId: ownerId,
        members: [], // Empty members to trigger the condition
      };

      // Mock the createGroup response
      mockKcAdminClient.groups.create.mockResolvedValue({ id: 'group-id' });

      await service.createGroup(mockOrganization as any);

      // Verify the right calls were made
      expect(mockKcAdminClient.users.addToGroup).toHaveBeenCalledWith({
        id: creatorId,
        groupId: 'group-id',
        realm: 'master',
      });

      expect(mockKcAdminClient.users.addToGroup).toHaveBeenCalledWith({
        id: ownerId,
        groupId: 'group-id',
        realm: 'master',
      });
    });
  });

  describe('removeGroup', () => {
    it('should remove a group by id', async () => {
      const groupId = 'test-group-id';

      await service.removeGroup(groupId);

      expect(mockKcAdminClient.auth).toHaveBeenCalled();
      expect(mockKcAdminClient.groups.del).toHaveBeenCalledWith({
        id: groupId,
        realm: 'master',
      });
    });
  });

  describe('inviteUserToGroup', () => {
    it('should throw UnauthorizedException if current user not found', async () => {
      mockKcAdminClient.users.findOne.mockResolvedValue(null);

      await expect(
        service.inviteUserToGroup(authContext, 'group-id', 'user-id'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user not in group', async () => {
      mockKcAdminClient.users.findOne.mockResolvedValue({
        id: authContext.keycloakUser.sub,
      });
      mockKcAdminClient.users.listGroups.mockResolvedValue([
        { name: 'other-group' },
      ]);

      await expect(
        service.inviteUserToGroup(authContext, 'group-id', 'user-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if invited user already in group', async () => {
      mockKcAdminClient.users.findOne
        .mockResolvedValueOnce({ id: authContext.keycloakUser.sub })
        .mockResolvedValueOnce({ id: 'user-id' });

      mockKcAdminClient.users.listGroups
        .mockResolvedValueOnce([{ name: 'organization-group-id' }])
        .mockResolvedValueOnce([{ name: 'organization-group-id' }]);

      await expect(
        service.inviteUserToGroup(authContext, 'group-id', 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if group not found', async () => {
      mockKcAdminClient.users.findOne
        .mockResolvedValueOnce({ id: authContext.keycloakUser.sub })
        .mockResolvedValueOnce({ id: 'user-id' });

      mockKcAdminClient.users.listGroups
        .mockResolvedValueOnce([{ name: 'organization-group-id' }])
        .mockResolvedValueOnce([]);

      mockKcAdminClient.groups.find.mockResolvedValue([]);

      await expect(
        service.inviteUserToGroup(authContext, 'group-id', 'user-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if multiple groups found', async () => {
      mockKcAdminClient.users.findOne
        .mockResolvedValueOnce({ id: authContext.keycloakUser.sub })
        .mockResolvedValueOnce({ id: 'user-id' });

      mockKcAdminClient.users.listGroups
        .mockResolvedValueOnce([{ name: 'organization-group-id' }])
        .mockResolvedValueOnce([]);

      mockKcAdminClient.groups.find.mockResolvedValue([
        { id: 'group1' },
        { id: 'group2' },
      ]);

      await expect(
        service.inviteUserToGroup(authContext, 'group-id', 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if requested user not found', async () => {
      mockKcAdminClient.users.findOne
        .mockResolvedValueOnce({ id: authContext.keycloakUser.sub })
        .mockResolvedValueOnce(null);

      mockKcAdminClient.users.listGroups.mockResolvedValueOnce([
        { name: 'organization-group-id' },
      ]);

      // Spy on console.log to verify it gets called
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await expect(
        service.inviteUserToGroup(authContext, 'group-id', 'nonexistent-user'),
      ).rejects.toThrow(UnauthorizedException);

      expect(consoleLogSpy).toHaveBeenCalledWith('user requester not found');
      consoleLogSpy.mockRestore();
    });

    it('should add user to group successfully', async () => {
      mockKcAdminClient.users.findOne
        .mockResolvedValueOnce({ id: authContext.keycloakUser.sub })
        .mockResolvedValueOnce({ id: 'user-id' });

      mockKcAdminClient.users.listGroups
        .mockResolvedValueOnce([{ name: 'organization-group-id' }])
        .mockResolvedValueOnce([]);

      mockKcAdminClient.groups.find.mockResolvedValue([
        { id: 'found-group-id', name: 'organization-group-id' },
      ]);

      await service.inviteUserToGroup(authContext, 'group-id', 'user-id');

      expect(mockKcAdminClient.users.addToGroup).toHaveBeenCalledWith({
        id: 'user-id',
        groupId: 'found-group-id',
        realm: 'master',
      });
    });
  });

  describe('getUsers', () => {
    it('should return all keycloak users', async () => {
      const mockUsers = [
        { id: '1', username: 'user1' },
        { id: '2', username: 'user2' },
      ];
      mockKcAdminClient.users.find.mockResolvedValue(mockUsers);

      const result = await service.getUsers();

      expect(mockKcAdminClient.auth).toHaveBeenCalled();
      expect(mockKcAdminClient.users.find).toHaveBeenCalledWith({
        realm: 'master',
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findKeycloakUserByEmail', () => {
    it('should return null if no user found', async () => {
      mockKcAdminClient.users.find.mockResolvedValue([]);

      const result = await service.findKeycloakUserByEmail(
        'nonexistent@test.com',
      );

      expect(result).toBeNull();
    });

    it('should return the first user if found', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      mockKcAdminClient.users.find.mockResolvedValue([mockUser]);

      const result = await service.findKeycloakUserByEmail('test@test.com');

      expect(result).toEqual(mockUser);
    });

    it('should warn and return first user if multiple users found', async () => {
      const mockUsers = [
        { id: '1', email: 'test@test.com' },
        { id: '2', email: 'test@test.com' },
      ];
      mockKcAdminClient.users.find.mockResolvedValue(mockUsers);

      // Spy on logger.warn
      const loggerWarnSpy = jest.spyOn((service as any).logger, 'warn');

      const result = await service.findKeycloakUserByEmail('test@test.com');

      expect(loggerWarnSpy).toHaveBeenCalled();
      expect(result).toEqual(mockUsers[0]);
    });
  });

  describe('getGroupForOrganization', () => {
    it('should return null if no group found', async () => {
      mockKcAdminClient.groups.find.mockResolvedValue([]);

      const result = await service.getGroupForOrganization('org-id');

      expect(result).toBeNull();
    });

    it('should return the group if found', async () => {
      const mockGroup = { id: '1', name: 'organization-org-id' };
      mockKcAdminClient.groups.find.mockResolvedValue([mockGroup]);

      const result = await service.getGroupForOrganization('org-id');

      expect(result).toEqual(mockGroup);
    });

    it('should throw error if multiple groups found', async () => {
      mockKcAdminClient.groups.find.mockResolvedValue([
        { id: '1', name: 'organization-org-id' },
        { id: '2', name: 'organization-org-id-copy' },
      ]);

      await expect(service.getGroupForOrganization('org-id')).rejects.toThrow(
        'More than one group found for organization',
      );
    });
  });

  describe('createUser', () => {
    it('should not create user if already exists', async () => {
      const user = new User(randomUUID(), 'existing@test.test');
      mockKcAdminClient.users.find.mockResolvedValue([{ id: 'existing-id' }]);

      await service.createUser(user);

      expect(mockKcAdminClient.auth).toHaveBeenCalled();
      expect(mockKcAdminClient.users.create).not.toHaveBeenCalled();
    });

    it('should create user if not exists', async () => {
      const user = new User(randomUUID(), 'new@test.test');
      mockKcAdminClient.users.find.mockResolvedValue([]);

      await service.createUser(user);

      expect(mockKcAdminClient.auth).toHaveBeenCalled();
      expect(mockKcAdminClient.users.create).toHaveBeenCalledWith({
        realm: 'master',
        username: user.email,
        email: user.email,
        emailVerified: true,
        enabled: true,
        attributes: {
          preferred_username: user.email,
        },
      });
    });
  });
});
