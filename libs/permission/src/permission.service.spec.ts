import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from './permission.service';
import { AuthContext } from '../auth/auth-request';
import { ForbiddenException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('PermissionService', () => {
  let service: PermissionService;
  let authContext: AuthContext;
  let userId: string;
  let organizationId: string;
  let module: TestingModule;

  beforeEach(async () => {
    // Mock dependencies

    // Create test AuthContext with user and permissions
    userId = randomUUID();
    organizationId = randomUUID();
    authContext = new AuthContext();
    authContext.keycloakUser = {
      sub: userId,
      email: 'test@example.com',
      name: 'Test User',
      preferred_username: 'testuser',
      email_verified: true,
      memberships: [],
    };

    module = await Test.createTestingModule({
      providers: [PermissionService],
    }).compile();

    // Silence logger during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    service = module.get<PermissionService>(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('canAccessOrganization', () => {
    it('should return false if user has no permissions', async () => {
      authContext.permissions = undefined;
      const result = await service.canAccessOrganization(
        organizationId,
        authContext,
      );
      expect(result).toBe(false);
    });

    it('should return false if user has no matching permission', async () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: 'other-org-id',
          scopes: ['organization:access'],
        },
      ];
      const result = await service.canAccessOrganization(
        organizationId,
        authContext,
      );
      expect(result).toBe(false);
    });

    it('should return false if user has matching organization but wrong scope', async () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: organizationId,
          scopes: ['organization:edit'],
        },
      ];
      const result = await service.canAccessOrganization(
        organizationId,
        authContext,
      );
      expect(result).toBe(false);
    });

    it('should return true if user has matching organization and access scope', async () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: organizationId,
          scopes: ['organization:access'],
        },
      ];
      const result = await service.canAccessOrganization(
        organizationId,
        authContext,
      );
      expect(result).toBe(true);
    });

    it('should return true if user has matching organization and multiple scopes including access', async () => {
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
      ];
      const result = await service.canAccessOrganization(
        organizationId,
        authContext,
      );
      expect(result).toBe(true);
    });
  });

  describe('canAccessOrganizationOrFail', () => {
    it('should throw ForbiddenException if user cannot access organization', async () => {
      authContext.permissions = [];
      await expect(
        service.canAccessOrganizationOrFail(organizationId, authContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return true if user can access organization', async () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: organizationId,
          scopes: ['organization:access'],
        },
      ];
      const result = await service.canAccessOrganizationOrFail(
        organizationId,
        authContext,
      );
      expect(result).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should return false if user has no permissions', async () => {
      authContext.permissions = undefined;
      const result = await service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource1' },
      ]);
      expect(result).toBe(false);
    });

    it('should return false if user does not have required resource permission', async () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: 'organization:resource1',
          scopes: ['read'],
        },
      ];
      const result = await service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource2' },
      ]);
      expect(result).toBe(false);
    });

    it('should return false if user has resource but is missing required scope', async () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: 'organization:resource1',
          scopes: ['read'],
        },
      ];
      const result = await service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource1', scopes: ['write'] },
      ]);
      expect(result).toBe(false);
    });

    it('should return true if user has all required permissions without scopes', async () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: 'organization:resource1',
          scopes: ['read'],
        },
      ];
      const result = await service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource1' },
      ]);
      expect(result).toBe(true);
    });

    it('should return true if user has all required permissions with matching scopes', async () => {
      authContext.permissions = [
        {
          type: 'organization',
          resource: 'organization:resource1',
          scopes: ['read', 'write'],
        },
      ];
      const result = await service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource1', scopes: ['read'] },
      ]);
      expect(result).toBe(true);
    });

    it('should return true if user has all required permissions for multiple resources', async () => {
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
      ];
      const result = await service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource1', scopes: ['write'] },
        { type: 'organization', resource: 'resource2', scopes: ['read'] },
      ]);
      expect(result).toBe(true);
    });

    it('should return false if user is missing one of multiple required permissions', async () => {
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
      ];
      const result = await service.hasPermission(authContext, [
        { type: 'organization', resource: 'resource1', scopes: ['write'] },
        { type: 'organization', resource: 'resource2', scopes: ['delete'] },
      ]);
      expect(result).toBe(false);
    });
  });
  afterEach(async () => {
    await module.close();
  });
});
