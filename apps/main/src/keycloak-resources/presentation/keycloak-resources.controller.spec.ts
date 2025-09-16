import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakResourcesController } from './keycloak-resources.controller';
import { KeycloakResourcesService } from '../infrastructure/keycloak-resources.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthContext } from '../../auth/auth-request';
import { randomUUID } from 'crypto';
import { User } from '../../users/domain/user';

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
      imports: [HttpModule, ConfigModule],
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
      mockAuthContext.user = new User(randomUUID(), 'test@test.test');

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
