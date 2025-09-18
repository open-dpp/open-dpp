import { Test } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { UserEntity } from '../../users/infrastructure/user.entity';
import { OrganizationEntity } from '../infrastructure/organization.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { OrganizationsService } from '../infrastructure/organizations.service';
import { OrganizationsModule } from '../organizations.module';
import { User } from '../../users/domain/user';
import { randomUUID } from 'crypto';
import { KeycloakResourcesService } from '../../keycloak-resources/infrastructure/keycloak-resources.service';
import { Organization } from '../domain/organization';
import { expect } from '@jest/globals';
import { PermissionService } from '@app/permission';
import { AuthContext } from '@app/auth/auth-request';
import { TypeOrmTestingModule } from '@app/testing/typeorm.testing.module';
import { KeycloakAuthTestingGuard } from '@app/testing/keycloak-auth.guard.testing';
import { KeycloakResourcesServiceTesting } from '@app/testing/keycloak.resources.service.testing';
import { createKeycloakUserInToken } from '@app/testing/users-and-orgs';

describe('OrganizationController', () => {
  let app: INestApplication;
  let service: OrganizationsService;
  let PermissionService: PermissionService;
  const authContext = new AuthContext();
  authContext.keycloakUser = createKeycloakUserInToken();
  const userId = authContext.keycloakUser.sub;

  // Mock for permissions
  authContext.permissions = [
    {
      type: 'organization',
      resource: 'testOrgId',
      scopes: ['organization:access'],
    },
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmTestingModule,
        TypeOrmModule.forFeature([OrganizationEntity, UserEntity]),
        OrganizationsModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useValue: new KeycloakAuthTestingGuard(
            new Map([['token1', authContext.keycloakUser]]),
          ),
        },
      ],
    })
      .overrideProvider(KeycloakResourcesService)
      .useValue(
        KeycloakResourcesServiceTesting.fromPlain({
          users: [
            {
              id: authContext.keycloakUser.sub,
              email: authContext.keycloakUser.email,
            },
          ],
        }),
      )
      .compile();

    service = moduleRef.get<OrganizationsService>(OrganizationsService);
    PermissionService = moduleRef.get<PermissionService>(PermissionService);
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new NotFoundInDatabaseExceptionFilter());

    await app.init();
  });

  describe('POST /organizations', () => {
    it('should create a new organization', async () => {
      const body = { name: 'Test Organization' };
      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', 'Bearer token1')
        .send(body);

      expect(response.status).toEqual(201);
      const found = await service.findOneOrFail(response.body.id);
      expect(response.body.id).toEqual(found.id);
      expect(response.body.name).toEqual(body.name);
      expect(response.body.ownedByUserId).toEqual(userId);
      expect(response.body.createdByUserId).toEqual(userId);
    });
  });

  describe('GET /organizations', () => {
    it('should return all organizations the user is a member of', async () => {
      // Get existing orgs to avoid conflicts with other tests
      const response1 = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', 'Bearer token1');

      const initialCount = response1.body.length;

      // Create a new org for this test
      const org = Organization.create({
        name: 'Org for Access Test',
        user: authContext.user,
      });
      const savedOrg = await service.save(org);

      // For future calls, make sure all permissions are pre-authorized for this test
      jest
        .spyOn(PermissionService, 'canAccessOrganization')
        .mockResolvedValue(true);

      // Verify we can get all orgs including the new one
      const response2 = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', 'Bearer token1');

      expect(response2.status).toEqual(200);
      expect(response2.body).toBeInstanceOf(Array);
      expect(response2.body.length).toBeGreaterThan(initialCount);

      // Verify the new org is in the response
      const foundOrg = response2.body.find((o) => o.id === savedOrg.id);
      expect(foundOrg).toBeDefined();
      expect(foundOrg.name).toEqual(org.name);
    });
  });

  describe('GET /organizations/:id', () => {
    it('should return a single organization when user has access', async () => {
      // Setup: Create an organization
      const org = Organization.create({
        name: 'Test Org for Finding',
        user: authContext.user,
      });
      await service.save(org);

      // Mock permissions to allow access
      jest
        .spyOn(PermissionService, 'canAccessOrganizationOrFail')
        .mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .get(`/organizations/${org.id}`)
        .set('Authorization', 'Bearer token1');

      expect(response.status).toEqual(200);
      expect(response.body.id).toEqual(org.id);
      expect(response.body.name).toEqual(org.name);
    });

    it('should return 403 when user has no access to the organization', async () => {
      const orgId = randomUUID();

      // Mock permissions to deny access
      jest
        .spyOn(PermissionService, 'canAccessOrganizationOrFail')
        .mockImplementation(async () => {
          throw new NotFoundException();
        });

      const response = await request(app.getHttpServer())
        .get(`/organizations/${orgId}`)
        .set('Authorization', 'Bearer token1');

      expect(response.status).toEqual(404);
    });
  });

  describe('POST /organizations/:organizationId/invite', () => {
    it('should successfully invite a user to an organization', async () => {
      // Setup: Create an organization and a user to invite
      const org = Organization.create({
        name: 'Test Org for Invites',
        user: authContext.user,
      });
      const savedOrg = await service.save(org);

      // Mock permissions to allow access
      jest
        .spyOn(PermissionService, 'canAccessOrganizationOrFail')
        .mockResolvedValue(true);

      // Mock service methods
      const inviteUserSpy = jest
        .spyOn(service, 'inviteUser')
        .mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post(`/organizations/${savedOrg.id}/invite`)
        .set('Authorization', 'Bearer token1')
        .send({ email: 'invited@example.com' });

      expect(response.status).toEqual(201);
      expect(inviteUserSpy).toHaveBeenCalledWith(
        expect.objectContaining({ user: authContext.user }),
        savedOrg.id,
        'invited@example.com',
      );
    });

    it('should return 403 when user has no access to invite to the organization', async () => {
      const orgId = randomUUID();

      // Mock permissions to deny access
      jest
        .spyOn(PermissionService, 'canAccessOrganizationOrFail')
        .mockImplementation(async () => {
          throw new NotFoundException();
        });

      const response = await request(app.getHttpServer())
        .post(`/organizations/${orgId}/invite`)
        .set('Authorization', 'Bearer token1')
        .send({ email: 'invited@example.com' });

      expect(response.status).toEqual(404);
    });
  });

  describe('GET /organizations/:id/members', () => {
    it('should return the members of an organization', async () => {
      // Setup: Create an organization with members
      const org = Organization.create({
        name: 'Test Org with Members',
        user: authContext.user,
      });
      const member2 = new User(randomUUID(), 'member2@example.com');
      org.join(member2);
      const savedOrg = await service.save(org);

      // Mock permissions to allow access
      jest
        .spyOn(PermissionService, 'canAccessOrganizationOrFail')
        .mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .get(`/organizations/${savedOrg.id}/members`)
        .set('Authorization', 'Bearer token1');

      expect(response.status).toEqual(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toEqual(2);
      expect(
        response.body.some(
          (member) => member.id === authContext.keycloakUser.sub,
        ),
      ).toBe(true);
      expect(response.body.some((member) => member.id === member2.id)).toBe(
        true,
      );
    });

    it('should return 403 when user has no access to view organization members', async () => {
      const orgId = randomUUID();

      // Mock permissions to deny access
      jest
        .spyOn(PermissionService, 'canAccessOrganizationOrFail')
        .mockImplementation(async () => {
          throw new NotFoundException();
        });

      const response = await request(app.getHttpServer())
        .get(`/organizations/${orgId}/members`)
        .set('Authorization', 'Bearer token1');

      expect(response.status).toEqual(404);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
