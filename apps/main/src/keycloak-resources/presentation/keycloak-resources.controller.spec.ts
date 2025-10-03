import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakResourcesController } from './keycloak-resources.controller';
import { KeycloakResourcesService } from '../infrastructure/keycloak-resources.service';
import { HttpModule } from '@nestjs/axios';
import { expect } from '@jest/globals';
import { AuthContext } from '@app/auth/auth-request';
import { createKeycloakUserInToken } from '@app/testing/users-and-orgs';
import { EnvModule } from '@app/env';

jest.mock('@keycloak/keycloak-admin-client', () => {
  return {
    __esModule: true, // Ensure Jest understands it's an ES module
    default: jest.fn(() => ({
      auth: jest.fn(),
      users: {
        find: jest.fn(),
      },
      groups: {
        create: jest.fn(),
      },
    })),
  };
});

describe('KeycloakResourcesController', () => {
  let controller: KeycloakResourcesController;
  let service: KeycloakResourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, EnvModule],
      providers: [
        {
          provide: KeycloakResourcesService,
          useValue: {
            createResource: jest.fn(),
          },
        },
      ],
      controllers: [KeycloakResourcesController],
    }).compile();

    controller = module.get<KeycloakResourcesController>(
      KeycloakResourcesController,
    );
    service = module.get<KeycloakResourcesService>(KeycloakResourcesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call createResource with correct parameters', async () => {
      // Arrange
      const mockAuthContext = new AuthContext();
      mockAuthContext.keycloakUser = createKeycloakUserInToken();

      const mockRequest = {
        authContext: mockAuthContext,
      };

      jest.spyOn(service, 'createResource').mockResolvedValue(undefined);

      // Act
      await controller.create(mockRequest as any);

      // Assert
      expect(service.createResource).toHaveBeenCalledWith(
        mockAuthContext,
        'organization123',
        ['/organizations/123'],
      );
    });
  });
});
