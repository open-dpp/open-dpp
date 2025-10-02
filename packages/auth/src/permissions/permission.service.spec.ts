import type { TestingModule } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import { expect } from '@jest/globals'
import { ForbiddenException, Logger } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AuthContext } from '../auth-request'
import { PermissionService } from './permission.service'

describe('permissionService', () => {
  let service: PermissionService
  let authContext: AuthContext
  let userId: string
  let organizationId: string
  let module: TestingModule

  beforeEach(async () => {
    // Mock dependencies

    // Create test AuthContext with user and permissions
    userId = randomUUID()
    organizationId = randomUUID()
    authContext = new AuthContext()
    authContext.keycloakUser = {
      sub: userId,
      email: 'test@example.com',
      name: 'Test User',
      preferred_username: 'testuser',
      email_verified: true,
      memberships: [],
    }

    module = await Test.createTestingModule({
      providers: [PermissionService],
    }).compile()

    // Silence logger during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined)
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)

    service = module.get<PermissionService>(PermissionService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('canAccessOrganization', () => {
    it('should return false if user has no permissions', () => {
      authContext.permissions = []
      const result = service.canAccessOrganization(organizationId, authContext)
      expect(result).toBe(false)
    })

    it('should return false if user has no matching permission', () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: 'other-org-id',
          scopes: ['organization:access'],
        },
      ]
      const result = service.canAccessOrganization(organizationId, authContext)
      expect(result).toBe(false)
    })

    it('should return false if user has matching organization but wrong scope', () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: organizationId,
          scopes: ['organization:edit'],
        },
      ]
      const result = service.canAccessOrganization(organizationId, authContext)
      expect(result).toBe(false)
    })

    it('should return true if user has matching organization and access scope', () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: organizationId,
          scopes: ['organization:access'],
        },
      ]
      const result = service.canAccessOrganization(organizationId, authContext)
      expect(result).toBe(true)
    })

    it('should return true if user has matching organization and multiple scopes including access', () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: organizationId,
          scopes: [
            'organization:edit',
            'organization:access',
            'organization:delete',
          ],
        },
      ]
      const result = service.canAccessOrganization(organizationId, authContext)
      expect(result).toBe(true)
    })
  })

  describe('canAccessOrganizationOrFail', () => {
    it('should throw ForbiddenException if user cannot access organization', async () => {
      authContext.permissions = []
      await expect(
        service.canAccessOrganizationOrFail(organizationId, authContext),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should return true if user can access organization', () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: organizationId,
          scopes: ['organization:access'],
        },
      ]
      const result = service.canAccessOrganizationOrFail(
        organizationId,
        authContext,
      )
      expect(result).toBe(true)
    })
  })

  describe('hasPermission', () => {
    it('should return false if user has no permissions', () => {
      authContext.permissions = []
      const result = service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource1' },
      ])
      expect(result).toBe(false)
    })

    it('should return false if user does not have required resource permission', () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: 'organization:resource1',
          scopes: ['read'],
        },
      ]
      const result = service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource2' },
      ])
      expect(result).toBe(false)
    })

    it('should return false if user has resource but is missing required scope', () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: 'organization:resource1',
          scopes: ['read'],
        },
      ]
      const result = service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource1', scopes: ['write'] },
      ])
      expect(result).toBe(false)
    })

    it('should return true if user has all required permissions without scopes', () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: 'organization:resource1',
          scopes: ['read'],
        },
      ]
      const result = service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource1' },
      ])
      expect(result).toBe(true)
    })

    it('should return true if user has all required permissions with matching scopes', () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: 'organization:resource1',
          scopes: ['read', 'write'],
        },
      ]
      const result = service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource1', scopes: ['read'] },
      ])
      expect(result).toBe(true)
    })

    it('should return true if user has all required permissions for multiple resources', () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: 'organization:resource1',
          scopes: ['read', 'write'],
        },
        {
          type: 'organization',
          resource: 'organization:resource2',
          scopes: ['read', 'delete'],
        },
      ]
      const result = service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource1', scopes: ['write'] },
        { type: 'organization', resource: 'resource2', scopes: ['read'] },
      ])
      expect(result).toBe(true)
    })

    it('should return false if user is missing one of multiple required permissions', () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: 'organization:resource1',
          scopes: ['read', 'write'],
        },
        {
          type: 'organization',
          resource: 'organization:resource2',
          scopes: ['read'],
        },
      ]
      const result = service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource1', scopes: ['write'] },
        { type: 'organization', resource: 'resource2', scopes: ['delete'] },
      ])
      expect(result).toBe(false)
    })
  })
  afterEach(async () => {
    await module.close()
  })
})
