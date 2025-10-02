import type { TestingModule } from '@nestjs/testing'
import { expect } from '@jest/globals'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { AuthContext } from '@open-dpp/auth/auth-request'
import { createKeycloakUserInToken } from '@open-dpp/testing/users-and-orgs'
import { KeycloakResourcesService } from '../infrastructure/keycloak-resources.service'
import { KeycloakResourcesController } from './keycloak-resources.controller'

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
  }
})

describe('keycloakResourcesController', () => {
  let controller: KeycloakResourcesController
  let service: KeycloakResourcesService

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
    }).compile()

    controller = module.get<KeycloakResourcesController>(
      KeycloakResourcesController,
    )
    service = module.get<KeycloakResourcesService>(KeycloakResourcesService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create', () => {
    it('should call createResource with correct parameters', async () => {
      // Arrange
      const mockAuthContext = new AuthContext()
      mockAuthContext.keycloakUser = createKeycloakUserInToken()

      const mockRequest = {
        authContext: mockAuthContext,
      }

      jest.spyOn(service, 'createResource').mockResolvedValue(undefined)

      // Act
      await controller.create(mockRequest as any)

      // Assert
      expect(service.createResource).toHaveBeenCalledWith(
        mockAuthContext,
        'organization123',
        ['/organizations/123'],
      )
    })
  })
})
