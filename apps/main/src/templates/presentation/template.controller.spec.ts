import type { INestApplication } from "@nestjs/common";
import type { Connection } from "mongoose";
import type { TemplateDbProps } from "../domain/template";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import getKeycloakAuthToken, {
  createKeycloakUserInToken,
  KeycloakAuthTestingGuard,
  KeycloakResourcesServiceTesting,
  MongooseTestingModule,
} from "@open-dpp/testing";
import request from "supertest";
import TestUsersAndOrganizations from "../../../test/test-users-and-orgs";
import { KeycloakResourcesService } from "../../keycloak-resources/infrastructure/keycloak-resources.service";
import { Organization } from "../../organizations/domain/organization";
import { OrganizationDbSchema, OrganizationDoc } from "../../organizations/infrastructure/organization.schema";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import { User } from "../../users/domain/user";
import { InjectUserToAuthContextGuard } from "../../users/infrastructure/inject-user-to-auth-context.guard";
import { UserDbSchema, UserDoc } from "../../users/infrastructure/user.schema";
import { UsersService } from "../../users/infrastructure/users.service";
import { Template } from "../domain/template";
import { laptopFactory } from "../fixtures/laptop.factory";
import { templateCreatePropsFactory } from "../fixtures/template.factory";
import { TemplateDoc, TemplateSchema } from "../infrastructure/template.schema";
import { TemplateService } from "../infrastructure/template.service";
import { templateToDto } from "./dto/template.dto";
import { TemplateController } from "./template.controller";

describe("templateController", () => {
  let app: INestApplication;
  let service: TemplateService;
  let mongoConnection: Connection;
  let organizationService: OrganizationsService;
  let usersService: UsersService;

  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(new Map());
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
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
        OrganizationsService,
        UsersService,
        TemplateService,
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
        {
          provide: APP_GUARD,
          useClass: InjectUserToAuthContextGuard,
        },
      ],
      controllers: [TemplateController],
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

    organizationService = moduleRef.get(OrganizationsService);
    usersService = moduleRef.get(UsersService);

    service = moduleRef.get<TemplateService>(TemplateService);
    mongoConnection = moduleRef.get<Connection>(getConnectionToken());
    app = moduleRef.createNestApplication();

    await app.init();

    await usersService.save(TestUsersAndOrganizations.users.user1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org2);
  });

  const laptopPlain: TemplateDbProps = laptopFactory
    .addSections()
    .build({ organizationId: TestUsersAndOrganizations.organizations.org1.id });

  const userHasNotThePermissionsTxt = `fails if user has not the permissions`;

  it(`/GET template`, async () => {
    const template = Template.loadFromDb({ ...laptopPlain });

    await service.save(template);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/templates/${template.id}`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(templateToDto(template));
  });

  it(`/GET template ${userHasNotThePermissionsTxt}`, async () => {
    const template = Template.create(
      templateCreatePropsFactory.build({
        organizationId: TestUsersAndOrganizations.organizations.org2.id,
      }),
    );
    await service.save(template);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org2.id}/templates/${template.id}`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send();
    expect(response.status).toEqual(403);
  });

  it(`/GET all templates which belong to the organization`, async () => {
    const keycloakUserTemp = createKeycloakUserInToken();
    const userTemp = User.create({
      email: keycloakUserTemp.email,
      keycloakUserId: keycloakUserTemp.sub,
    });
    const orgTemp = Organization.create({
      name: "organization-temp-test",
      ownedByUserId: userTemp.id,
      createdByUserId: userTemp.id,
      members: [userTemp],
    });
    await usersService.save(userTemp);
    await organizationService.save(orgTemp);
    const laptopTemplate = Template.loadFromDb({
      ...laptopPlain,
      organizationId: orgTemp.id,
    });
    const phoneTemplate = Template.loadFromDb({
      ...laptopPlain,
      id: randomUUID(),
      name: "phone",
      organizationId: orgTemp.id,
    });
    const notAccessibleTemplate = Template.create(
      templateCreatePropsFactory.build({
        name: "privateModel",
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
      }),
    );

    await service.save(laptopTemplate);
    await service.save(phoneTemplate);
    await service.save(notAccessibleTemplate);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${orgTemp.id}/templates`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          keycloakUserTemp.sub,
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(200);

    expect(response.body).toContainEqual({
      id: laptopTemplate.id,
      name: laptopTemplate.name,
      version: laptopTemplate.version,
      description: laptopTemplate.description,
      sectors: laptopTemplate.sectors,
    });
    expect(response.body).toContainEqual({
      id: phoneTemplate.id,
      name: phoneTemplate.name,
      version: phoneTemplate.version,
      description: phoneTemplate.description,
      sectors: phoneTemplate.sectors,
    });
    expect(response.body).not.toContainEqual({
      id: notAccessibleTemplate.id,
      name: notAccessibleTemplate.name,
      version: notAccessibleTemplate.version,
      description: notAccessibleTemplate.description,
      sectors: notAccessibleTemplate.sectors,
    });
  });

  it(`/GET all templates which belong to the organization ${userHasNotThePermissionsTxt}`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org2.id}/templates`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  afterAll(async () => {
    await app.close();
    await mongoConnection.close();
  });
});
