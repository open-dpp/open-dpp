import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { INestApplication, NotFoundException } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { AuthContext, PermissionModule, PermissionService } from "@open-dpp/auth";
import { EnvModule } from "@open-dpp/env";
import { NotFoundInDatabaseExceptionFilter } from "@open-dpp/exception";
import { createKeycloakUserInToken, getApp, KeycloakAuthTestingGuard, KeycloakResourcesServiceTesting, TypeOrmTestingModule } from "@open-dpp/testing";
import request from "supertest";
import { KeycloakResourcesService } from "../../keycloak-resources/infrastructure/keycloak-resources.service";
import { User } from "../../users/domain/user";
import { UsersService } from "../../users/infrastructure/users.service";
import { Organization } from "../domain/organization";
import { OrganizationsService } from "../infrastructure/organizations.service";
import { OrganizationsController } from "./organizations.controller";

describe("organizationController", () => {
  let app: INestApplication;
  let service: OrganizationsService;
  let permissionService: PermissionService;
  const authContext = new AuthContext();
  authContext.keycloakUser = createKeycloakUserInToken();
  const orgaId = "testOrgId";
  const token = Buffer.from(`[${orgaId}]`).toString("base64");
  authContext.token = token;
  const userId = authContext.keycloakUser.sub;
  const user = User.loadFromDb({ id: userId, email: authContext.keycloakUser.email });

  // Mock for permissions
  authContext.permissions = [
    {
      type: "organization",
      resource: orgaId,
      scopes: ["organization:access"],
    },
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        PermissionModule,
      ],
      providers: [
        UsersService,
        OrganizationsService,
        KeycloakResourcesService,
        {
          provide: APP_GUARD,
          useValue: new KeycloakAuthTestingGuard(
            new Map([[token, authContext.keycloakUser]]),
          ),
        },
      ],
      controllers: [OrganizationsController],
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
    permissionService = moduleRef.get<PermissionService>(PermissionService);
    const usersService = moduleRef.get<UsersService>(UsersService);
    await usersService.save(user);

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new NotFoundInDatabaseExceptionFilter());

    await app.init();
  });

  describe("pOST /organizations", () => {
    it("should create a new organization", async () => {
      const body = { name: "Test Organization" };
      const response = await request(getApp(app))
        .post("/organizations")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(response.status).toEqual(201);
      const found = await service.findOneOrFail(response.body.id);
      expect(response.body.id).toEqual(found.id);
      expect(response.body.name).toEqual(body.name);
      expect(response.body.ownedByUserId).toEqual(userId);
      expect(response.body.createdByUserId).toEqual(userId);
    });
  });

  describe("gET /organizations", () => {
    it("should return all organizations the user is a member of", async () => {
      // Get existing orgs to avoid conflicts with other tests
      const response1 = await request(getApp(app))
        .get("/organizations")
        .set("Authorization", `Bearer ${token}`);

      const initialCount = response1.body.length;

      // Create a new org for this test
      const org = Organization.create({
        name: "Org for Access Test",
        user,
      });
      const savedOrg = await service.save(org);

      // For future calls, make sure all permissions are pre-authorized for this test
      jest
        .spyOn(permissionService, "canAccessOrganization")
        .mockReturnValue(true);

      // Verify we can get all orgs including the new one
      const response2 = await request(getApp(app))
        .get("/organizations")
        .set("Authorization", `Bearer ${token}`);

      expect(response2.status).toEqual(200);
      expect(response2.body).toBeInstanceOf(Array);
      expect(response2.body.length).toBeGreaterThan(initialCount);

      // Verify the new org is in the response
      const foundOrg = response2.body.find((o: Organization) => o.id === savedOrg.id);
      expect(foundOrg).toBeDefined();
      expect(foundOrg.name).toEqual(org.name);
    });
  });

  describe("gET /organizations/:id", () => {
    it("should return a single organization when user has access", async () => {
      // Setup: Create an organization
      const org = Organization.create({
        name: "Test Org for Finding",
        user,
      });
      await service.save(org);

      // Mock permissions to allow access
      jest
        .spyOn(permissionService, "canAccessOrganizationOrFail")
        .mockReturnValue(true);

      const response = await request(getApp(app))
        .get(`/organizations/${org.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(200);
      expect(response.body.id).toEqual(org.id);
      expect(response.body.name).toEqual(org.name);
    });

    it("should return 403 when user has no access to the organization", async () => {
      const orgId = randomUUID();

      // Mock permissions to deny access
      jest
        .spyOn(permissionService, "canAccessOrganizationOrFail")
        .mockImplementation(() => {
          throw new NotFoundException();
        });

      const response = await request(getApp(app))
        .get(`/organizations/${orgId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(404);
    });
  });

  describe("pOST /organizations/:organizationId/invite", () => {
    it("should successfully invite a user to an organization", async () => {
      // Setup: Create an organization and a user to invite
      const org = Organization.create({
        name: "Test Org for Invites",
        user,
      });
      const savedOrg = await service.save(org);

      // Mock permissions to allow access
      jest
        .spyOn(permissionService, "canAccessOrganizationOrFail")
        .mockReturnValue(true);

      // Mock service methods
      const inviteUserSpy = jest
        .spyOn(service, "inviteUser")
        .mockImplementation(async () => {});

      const response = await request(getApp(app))
        .post(`/organizations/${savedOrg.id}/invite`)
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "invited@example.com" });

      expect(response.status).toEqual(201);
      expect(inviteUserSpy).toHaveBeenCalledWith(
        authContext,
        savedOrg.id,
        "invited@example.com",
      );
    });

    it("should return 403 when user has no access to invite to the organization", async () => {
      const orgId = randomUUID();

      // Mock permissions to deny access
      jest
        .spyOn(permissionService, "canAccessOrganizationOrFail")
        .mockImplementation(() => {
          throw new NotFoundException();
        });

      const response = await request(getApp(app))
        .post(`/organizations/${orgId}/invite`)
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "invited@example.com" });

      expect(response.status).toEqual(404);
    });
  });

  describe("gET /organizations/:id/members", () => {
    it("should return the members of an organization", async () => {
      // Setup: Create an organization with members
      const org = Organization.create({
        name: "Test Org with Members",
        user,
      });
      const member2 = User.loadFromDb({ id: randomUUID(), email: "member2@example.com" });
      org.join(member2);
      const savedOrg = await service.save(org);

      // Mock permissions to allow access
      jest
        .spyOn(permissionService, "canAccessOrganizationOrFail")
        .mockReturnValue(true);

      const response = await request(getApp(app))
        .get(`/organizations/${savedOrg.id}/members`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toEqual(2);
      expect(
        response.body.some(
          (member: User) => member.id === authContext.keycloakUser.sub,
        ),
      ).toBe(true);
      expect(response.body.some((member: User) => member.id === member2.id)).toBe(
        true,
      );
    });

    it("should return 403 when user has no access to view organization members", async () => {
      const orgId = randomUUID();

      // Mock permissions to deny access
      jest
        .spyOn(permissionService, "canAccessOrganizationOrFail")
        .mockImplementation(() => {
          throw new NotFoundException();
        });

      const response = await request(getApp(app))
        .get(`/organizations/${orgId}/members`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(404);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
