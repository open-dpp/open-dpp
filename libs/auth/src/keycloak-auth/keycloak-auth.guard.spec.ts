import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakAuthGuard } from './keycloak-auth.guard';
import { ConfigService } from '@nestjs/config';
import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC } from '../public/public.decorator';
import { KeycloakUserInToken } from './KeycloakUserInToken';
import { HttpModule } from '@nestjs/axios';
import { expect } from '@jest/globals';
import { AuthContext } from '@app/auth/auth-request';

const mockRequestGet = jest.fn();

describe('KeycloakAuthGuard', () => {
  let guard: KeycloakAuthGuard;
  let reflector: Reflector;

  const mockUser: KeycloakUserInToken = {
    sub: 'test-user-id',
    email: 'user@example.com',
    name: 'Test User',
    preferred_username: 'testuser',
    email_verified: true,
    memberships: [],
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        KeycloakAuthGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-public-key'),
          },
        },
      ],
    }).compile();

    guard = module.get<KeycloakAuthGuard>(KeycloakAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let context: ExecutionContext;
    let mockRequest: {
      headers: Record<string, string>;
      get: jest.Mock;
      authContext?: AuthContext;
    };

    beforeEach(() => {
      mockRequest = {
        headers: {},
        get: mockRequestGet,
      };
      context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
      } as unknown as ExecutionContext;
    });

    it('should return true for public routes', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.get).toHaveBeenCalledWith(IS_PUBLIC, expect.any(Object));
    });

    it('should throw unauthorized exception when authorization header is missing', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(false);

      mockRequestGet.mockReturnValue(undefined);
      await expect(guard.canActivate(context)).rejects.toThrow(
        new HttpException('Authorization missing', HttpStatus.UNAUTHORIZED),
      );
      expect(mockRequestGet).toHaveBeenCalledWith('authorization');
    });

    it('should throw unauthorized exception when authorization format is invalid', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(false);
      mockRequestGet.mockReturnValue('InvalidFormat');

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException(
          'Authorization: Bearer <token> header invalid',
        ),
      );
      expect(mockRequestGet).toHaveBeenCalledWith('authorization');
    });

    it('should authenticate user and set auth context with permissions', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(false);

      mockRequestGet.mockReturnValue('Bearer valid-token');

      const mockPayload = {
        ...mockUser,
        memberships: ['organization-org1', 'organization-org2'],
      };

      jest.spyOn(guard, 'validateToken').mockResolvedValue(mockPayload);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRequest.authContext).toBeDefined();
      expect(mockRequest.authContext!.keycloakUser).toEqual(mockPayload);
      expect(mockRequest.authContext!.permissions).toEqual([
        {
          type: 'organization',
          resource: 'org1',
          scopes: ['organization:access'],
        },
        {
          type: 'organization',
          resource: 'org2',
          scopes: ['organization:access'],
        },
      ]);
      expect(mockRequestGet).toHaveBeenCalledWith('authorization');
    });

    it('should handle empty memberships', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(false);
      mockRequestGet.mockReturnValue('Bearer valid-token');

      const mockPayload = {
        ...mockUser,
        // No memberships property
      };

      jest.spyOn(guard, 'validateToken').mockResolvedValue(mockPayload);

      const result = await guard.canActivate(context);
      expect(mockRequestGet).toHaveBeenCalledWith('authorization');

      expect(result).toBe(true);
      expect(mockRequest.authContext!.permissions).toEqual([]);
    });
  });
});
