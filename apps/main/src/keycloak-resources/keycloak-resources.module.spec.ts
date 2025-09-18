import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakResourcesModule } from './keycloak-resources.module';
import { KeycloakResourcesService } from './infrastructure/keycloak-resources.service';
import { KeycloakResourcesController } from './presentation/keycloak-resources.controller';
import { ConfigModule } from '@nestjs/config';
import { expect } from '@jest/globals';

// Mock the Keycloak admin client
jest.mock('@keycloak/keycloak-admin-client', () => {
  return {
    __esModule: true,
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

describe('KeycloakResourcesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        KeycloakResourcesModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide KeycloakResourcesService', () => {
    const service = module.get<KeycloakResourcesService>(
      KeycloakResourcesService,
    );
    expect(service).toBeDefined();
  });

  it('should provide KeycloakResourcesController', () => {
    const controller = module.get<KeycloakResourcesController>(
      KeycloakResourcesController,
    );
    expect(controller).toBeDefined();
  });
});
