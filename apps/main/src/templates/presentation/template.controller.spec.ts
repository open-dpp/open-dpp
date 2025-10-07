import type { INestApplication } from "@nestjs/common";
import type { Connection } from "mongoose";
import type { TemplateDbProps } from "../domain/template";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { AuthContext, PermissionModule } from "@open-dpp/auth";
import { EnvModule } from "@open-dpp/env";
import getKeycloakAuthToken, { createKeycloakUserInToken, KeycloakAuthTestingGuard, KeycloakResourcesServiceTesting, MongooseTestingModule } from "@open-dpp/testing";
import request from "supertest";
import { KeycloakResourcesService } from "../../keycloak-resources/infrastructure/keycloak-resources.service";
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

  const authContext = new AuthContext();
  authContext.keycloakUser = createKeycloakUserInToken();
  const organizationId = randomUUID();
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
        ]),
        PermissionModule,
      ],
      providers: [
        TemplateService,
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
      ],
      controllers: [TemplateController],
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

    service = moduleRef.get<TemplateService>(TemplateService);
    mongoConnection = moduleRef.get<Connection>(getConnectionToken());
    app = moduleRef.createNestApplication();

    await app.init();
  });

  const laptopPlain: TemplateDbProps = laptopFactory
    .addSections()
    .build({ organizationId });

  const userHasNotThePermissionsTxt = `fails if user has not the permissions`;

  it(`/GET template`, async () => {
    const template = Template.loadFromDb({ ...laptopPlain });

    await service.save(template);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/templates/${template.id}`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      )
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(templateToDto(template));
  });

  it(`/GET template ${userHasNotThePermissionsTxt}`, async () => {
    const otherOrganizationId = randomUUID();
    const template = Template.create(
      templateCreatePropsFactory.build({
        organizationId: otherOrganizationId,
      }),
    );
    await service.save(template);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${otherOrganizationId}/templates/${template.id}`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      )
      .send();
    expect(response.status).toEqual(403);
  });

  it(`/GET all templates which belong to the organization`, async () => {
    const otherOrganizationId = randomUUID();
    const laptopTemplate = Template.loadFromDb({
      ...laptopPlain,
    });
    const phoneTemplate = Template.loadFromDb({
      ...laptopPlain,
      id: randomUUID(),
      name: "phone",
    });
    const notAccessibleTemplate = Template.create(
      templateCreatePropsFactory.build({
        name: "privateModel",
        organizationId: otherOrganizationId,
      }),
    );

    await service.save(laptopTemplate);
    await service.save(phoneTemplate);
    await service.save(notAccessibleTemplate);
    const response = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/templates`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organizationId],
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
    const otherOrganizationId = randomUUID();
    const response = await request(app.getHttpServer())
      .get(`/organizations/${otherOrganizationId}/templates`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organizationId],
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
