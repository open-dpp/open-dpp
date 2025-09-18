import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakSyncOnStartupService } from './keycloak-sync-on-startup.service';
import { UsersService } from '../../users/infrastructure/users.service';
import { KeycloakResourcesService } from '../../keycloak-resources/infrastructure/keycloak-resources.service';
import { OrganizationsService } from '../../organizations/infrastructure/organizations.service';
import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../../users/users.module';
import { DataSource } from 'typeorm';
import { expect } from '@jest/globals';
import { TypeOrmTestingModule } from '@app/testing/typeorm.testing.module';
import {
  keycloakUsers,
  org1,
  user1org1,
  user2org1,
} from '@app/testing/users-and-orgs';

describe('UsersSyncOnStartupService', () => {
  let service: KeycloakSyncOnStartupService;
  let usersService: UsersService;
  let keycloakResourcesService: KeycloakResourcesService;
  let organizationsService: OrganizationsService;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, TypeOrmTestingModule, UsersModule],
      providers: [
        KeycloakSyncOnStartupService,
        KeycloakResourcesService,
        {
          provide: OrganizationsService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KeycloakSyncOnStartupService>(
      KeycloakSyncOnStartupService,
    );
    usersService = module.get<UsersService>(UsersService);
    keycloakResourcesService = module.get<KeycloakResourcesService>(
      KeycloakResourcesService,
    );
    organizationsService =
      module.get<OrganizationsService>(OrganizationsService);

    dataSource = module.get<DataSource>(DataSource);

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(async () => {
    jest.clearAllMocks();

    await dataSource.destroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onApplicationBootstrap', () => {
    it('should sync users from Keycloak to database', async () => {
      // Setup mocks
      jest
        .spyOn(keycloakResourcesService, 'getUsers')
        .mockResolvedValue(keycloakUsers);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValueOnce(user1org1) // First user exists
        .mockResolvedValueOnce(undefined); // Second user doesn't exist
      jest.spyOn(organizationsService, 'findAll').mockResolvedValue([org1]);
      jest
        .spyOn(keycloakResourcesService, 'getGroupForOrganization')
        .mockResolvedValue(null); // Group doesn't exist, will be created
      jest.spyOn(usersService, 'create');
      jest.spyOn(keycloakResourcesService, 'createGroup');
      jest.spyOn(keycloakResourcesService, 'inviteUserToGroup');

      // Execute
      await service.sync();

      // Verify
      expect(keycloakResourcesService.getUsers).toHaveBeenCalledTimes(1);
      expect(usersService.findOne).toHaveBeenCalledWith(user1org1.id);
      expect(usersService.findOne).toHaveBeenCalledWith(user2org1.id);

      // Should only create the second user (the first one exists)
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: user2org1.id,
        }),
        true,
      );
    });

    it('should handle case when keycloak group exists', async () => {
      // Setup mocks
      jest
        .spyOn(keycloakResourcesService, 'getUsers')
        .mockResolvedValue(keycloakUsers);
      jest.spyOn(organizationsService, 'findAll').mockResolvedValue([org1]);
      jest
        .spyOn(keycloakResourcesService, 'getGroupForOrganization')
        .mockResolvedValue({ id: 'group1', name: 'organization-org1' }); // Group exists
      jest.spyOn(keycloakResourcesService, 'createGroup');
      jest.spyOn(keycloakResourcesService, 'inviteUserToGroup');

      // Execute
      await service.sync();

      // Verify
      expect(keycloakResourcesService.createGroup).not.toHaveBeenCalled(); // Group exists, shouldn't create
    });

    it('should handle error when inviting user to group', async () => {
      console.warn = jest.fn(); // Mock console.warn

      // Setup mocks
      jest
        .spyOn(keycloakResourcesService, 'getUsers')
        .mockResolvedValue(keycloakUsers);
      jest.spyOn(organizationsService, 'findAll').mockResolvedValue([org1]);
      jest
        .spyOn(keycloakResourcesService, 'getGroupForOrganization')
        .mockResolvedValue({ id: 'group1', name: `organization-${org1.id}` });

      // Mock inviteUserToGroup to throw a non-400 error
      jest
        .spyOn(keycloakResourcesService, 'inviteUserToGroup')
        .mockRejectedValue({ status: 500, message: 'Server error' });

      // Execute
      await service.sync();
    });

    it('should not log error when inviting user fails with 400 status', async () => {
      console.warn = jest.fn(); // Mock console.warn

      // Setup mocks
      jest
        .spyOn(keycloakResourcesService, 'getUsers')
        .mockResolvedValue(keycloakUsers);
      jest.spyOn(organizationsService, 'findAll').mockResolvedValue([org1]);
      jest
        .spyOn(keycloakResourcesService, 'getGroupForOrganization')
        .mockResolvedValue({ id: 'group1', name: 'organization-org1' });

      // Mock inviteUserToGroup to throw a 400 error
      jest
        .spyOn(keycloakResourcesService, 'inviteUserToGroup')
        .mockRejectedValue({ status: 400, message: 'Bad request' });

      // Execute
      await service.sync();

      // Verify
      expect(console.warn).not.toHaveBeenCalled(); // Should not log 400 errors
    });
  });
});
