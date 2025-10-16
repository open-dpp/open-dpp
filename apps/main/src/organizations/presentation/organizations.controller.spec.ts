import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import { NotFoundInDatabaseExceptionFilter } from "@open-dpp/exception";
import getKeycloakAuthToken, {
  createKeycloakUserInToken,
  getApp,
  KeycloakAuthTestingGuard,
  KeycloakResourcesServiceTesting,
  MongooseTestingModule,
} from "@open-dpp/testing";
import request from "supertest";
import TestUsersAndOrganizations from "../../../test/test-users-and-orgs";
import { KeycloakResourcesService } from "../../keycloak-resources/infrastructure/keycloak-resources.service";

import { User } from "../../users/domain/user";
import { InjectUserToAuthContextGuard } from "../../users/infrastructure/inject-user-to-auth-context.guard";
import { UserDbSchema, UserDoc } from "../../users/infrastructure/user.schema";
import { UsersService } from "../../users/infrastructure/users.service";
import { Organization } from "../domain/organization";
import { OrganizationDbSchema, OrganizationDoc } from "../infrastructure/organization.schema";
import { OrganizationsService } from "../infrastructure/organizations.service";
import { OrganizationsController } from "./organizations.controller";

describe("organizationController", () => {
  let app: INestApplication;
  let service: OrganizationsService;
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(
    new Map(),
  );
  let organizationService: OrganizationsService;
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: OrganizationDoc.name,
            schema: OrganizationDbSchema,
          },
          {
            name: UserDoc.name,
            schema: UserDbSchema,
          },
        ]),
      ],
      providers: [
        UsersService,
        OrganizationsService,
        KeycloakResourcesService,
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
        {
          provide: APP_GUARD,
          useClass: InjectUserToAuthContextGuard,
        },
      ],
      controllers: [OrganizationsController],
    })
      .overrideProvider(KeycloakResourcesService)
      .useValue(
        KeycloakResourcesServiceTesting.fromPlain({
          users: [
            {
              id: TestUsersAndOrganizations.keycloakUsers.keycloakUser1.sub,
              email: TestUsersAndOrganizations.keycloakUsers.keycloakUser1.email,
            },
          ],
        }),
      )
      .compile();

    service = moduleRef.get<OrganizationsService>(OrganizationsService);
    organizationService = moduleRef.get(OrganizationsService);
    usersService = moduleRef.get(UsersService);

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new NotFoundInDatabaseExceptionFilter());

    await app.init();

    await usersService.save(TestUsersAndOrganizations.users.user1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org2);
  });

  describe("pOST /organizations", () => {
    it("should create a new organization", async () => {
      const body = { name: "Test Organization" };
      const response = await request(getApp(app))
        .post("/organizations")
        .set(
          "Authorization",
          getKeycloakAuthToken(
            TestUsersAndOrganizations.users.user1.keycloakUserId,
            keycloakAuthTestingGuard,
          ),
        )
        .send(body);

      expect(response.status).toEqual(201);
      const found = await service.findOneOrFail(response.body.id);
      expect(response.body.id).toEqual(found.id);
      expect(response.body.name).toEqual(body.name);
      expect(response.body.ownedByUserId).toEqual(TestUsersAndOrganizations.users.user1.id);
      expect(response.body.createdByUserId).toEqual(TestUsersAndOrganizations.users.user1.id);
    });
  });

  describe("gET /organizations", () => {
    it("should return all organizations the user is a member of", async () => {
      // Get existing orgs to avoid conflicts with other tests
      const response1 = await request(getApp(app))
        .get("/organizations")
        .set(
          "Authorization",
          getKeycloakAuthToken(
            TestUsersAndOrganizations.users.user1.keycloakUserId,
            keycloakAuthTestingGuard,
          ),
        );

      const initialCount = response1.body.length;

      // Create a new org for this test
      const org = Organization.create({
        name: "Test Org for access test",
        createdByUserId: TestUsersAndOrganizations.users.user1.id,
        ownedByUserId: TestUsersAndOrganizations.users.user1.id,
        members: [TestUsersAndOrganizations.users.user1],
      });
      const savedOrg = await service.save(org);

      // Verify we can get all orgs including the new one
      const response2 = await request(getApp(app))
        .get("/organizations")
        .set(
          "Authorization",
          getKeycloakAuthToken(
            TestUsersAndOrganizations.users.user1.keycloakUserId,
            keycloakAuthTestingGuard,
          ),
        );

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
        createdByUserId: TestUsersAndOrganizations.users.user1.id,
        ownedByUserId: TestUsersAndOrganizations.users.user1.id,
        members: [TestUsersAndOrganizations.users.user1],
      });
      await service.save(org);

      const response = await request(getApp(app))
        .get(`/organizations/${org.id}`)
        .set(
          "Authorization",
          getKeycloakAuthToken(
            TestUsersAndOrganizations.users.user1.keycloakUserId,
            keycloakAuthTestingGuard,
          ),
        );

      expect(response.status).toEqual(200);
      expect(response.body.id).toEqual(org.id);
      expect(response.body.name).toEqual(org.name);
    });

    it("should return 403 when user has no access to the organization", async () => {
      const orgId = randomUUID();

      const response = await request(getApp(app))
        .get(`/organizations/${orgId}`)
        .set(
          "Authorization",
          getKeycloakAuthToken(
            TestUsersAndOrganizations.users.user1.keycloakUserId,
            keycloakAuthTestingGuard,
          ),
        );

      expect(response.status).toEqual(404);
    });
  });

  describe("gET /organizations/:id/members", () => {
    it("should return the members of an organization", async () => {
      // Setup: Create an organization with members
      const org = Organization.create({
        name: "Test Org with Members",
        createdByUserId: TestUsersAndOrganizations.users.user1.id,
        ownedByUserId: TestUsersAndOrganizations.users.user1.id,
        members: [TestUsersAndOrganizations.users.user1],
      });
      const keycloakUserTemp = createKeycloakUserInToken();
      const userTemp = User.create({
        email: keycloakUserTemp.email,
        keycloakUserId: keycloakUserTemp.sub,
      });
      await usersService.save(userTemp);
      org.join(userTemp);
      const savedOrg = await service.save(org);

      const response = await request(getApp(app))
        .get(`/organizations/${savedOrg.id}/members`)
        .set(
          "Authorization",
          getKeycloakAuthToken(
            TestUsersAndOrganizations.users.user1.keycloakUserId,
            keycloakAuthTestingGuard,
          ),
        );

      expect(response.status).toEqual(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toEqual(2);
      expect(
        response.body.some(
          (member: User) => member.id === TestUsersAndOrganizations.users.user1.id,
        ),
      ).toBe(true);
      expect(response.body.some((member: User) => member.id === userTemp.id)).toBe(
        true,
      );
    });

    it("should return 403 when user has no access to view organization members", async () => {
      const orgId = randomUUID();

      const response = await request(getApp(app))
        .get(`/organizations/${orgId}/members`)
        .set(
          "Authorization",
          getKeycloakAuthToken(
            TestUsersAndOrganizations.users.user1.keycloakUserId,
            keycloakAuthTestingGuard,
          ),
        );

      expect(response.status).toEqual(404);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
