import type { INestApplication } from "@nestjs/common";
import type { TemplateDbProps } from "../../templates/domain/template";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { ALLOW_SERVICE_ACCESS, AuthContext, PermissionModule } from "@open-dpp/auth";
import getKeycloakAuthToken, {
  createKeycloakUserInToken,
  KeycloakAuthTestingGuard,
  KeycloakResourcesServiceTesting,
  MongooseTestingModule,
  TypeOrmTestingModule,
} from "@open-dpp/testing";
import request from "supertest";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { Item } from "../../items/domain/item";
import { ItemDoc, ItemSchema } from "../../items/infrastructure/item.schema";
import { ItemsService } from "../../items/infrastructure/items.service";

import { KeycloakResourcesService } from "../../keycloak-resources/infrastructure/keycloak-resources.service";
import { Model } from "../../models/domain/model";
import { ModelDoc, ModelSchema } from "../../models/infrastructure/model.schema";
import { ModelsService } from "../../models/infrastructure/models.service";
import { OrganizationEntity } from "../../organizations/infrastructure/organization.entity";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import { phoneFactory } from "../../product-passport/fixtures/product-passport.factory";
import { Template } from "../../templates/domain/template";
import { TemplateDoc, TemplateSchema } from "../../templates/infrastructure/template.schema";
import { TemplateService } from "../../templates/infrastructure/template.service";
import { UserEntity } from "../../users/infrastructure/user.entity";
import { UsersService } from "../../users/infrastructure/users.service";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "../infrastructure/unique-product-identifier.service";
import { UniqueProductIdentifierController } from "./unique.product.identifier.controller";

describe("uniqueProductIdentifierController", () => {
  let app: INestApplication;
  let modelsService: ModelsService;
  let itemsService: ItemsService;
  const serviceToken = "serviceToken";

  let templateService: TemplateService;
  const reflector: Reflector = new Reflector();
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(
    new Map(),
    reflector,
    new Map([["SERVICE_TOKEN", serviceToken]]),
  );
  const authContext = new AuthContext();
  authContext.keycloakUser = createKeycloakUserInToken();
  const organizationId = randomUUID();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmTestingModule,
        TypeOrmTestingModule.forFeature([OrganizationEntity, UserEntity]),
        PermissionModule,
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: ModelDoc.name,
            schema: ModelSchema,
          },
          {
            name: UniqueProductIdentifierDoc.name,
            schema: UniqueProductIdentifierSchema,
          },
          {
            name: ItemDoc.name,
            schema: ItemSchema,
          },
          {
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
        ]),
      ],
      providers: [
        UsersService,
        OrganizationsService,
        KeycloakResourcesService,
        ModelsService,
        UniqueProductIdentifierService,
        ItemsService,
        TemplateService,
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
      ],
      controllers: [UniqueProductIdentifierController],
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

    modelsService = moduleRef.get(ModelsService);
    itemsService = moduleRef.get(ItemsService);
    templateService = moduleRef.get<TemplateService>(TemplateService);

    app = moduleRef.createNestApplication();

    await app.init();
  });
  beforeEach(() => {
    jest.spyOn(reflector, "get").mockReturnValue(false);
  });

  const authProps = { userId: authContext.keycloakUser.sub, organizationId };
  const phoneTemplate: TemplateDbProps = phoneFactory
    .addSections()
    .build(authProps);

  it(`/GET reference of unique product identifier`, async () => {
    const template = Template.loadFromDb({ ...phoneTemplate });
    await templateService.save(template);
    const model = Model.create({
      name: "model",
      userId: randomUUID(),
      organizationId: randomUUID(),
      template,
    });
    const item = Item.create({
      organizationId,
      userId: authContext.keycloakUser.sub,
      template,
      model,
    });
    const { uuid } = item.createUniqueProductIdentifier("externalId");
    await itemsService.save(item);

    const response = await request(app.getHttpServer())
      .get(
        `/organizations/${organizationId}/unique-product-identifiers/${uuid}/reference`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      );

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: item.id,
      organizationId,
      modelId: model.id,
      granularityLevel: GranularityLevel.ITEM,
    });
  });

  it(`/GET organizationId of unique product identifier`, async () => {
    jest
      .spyOn(reflector, "get")
      .mockImplementation(key => key === ALLOW_SERVICE_ACCESS);

    const template = Template.loadFromDb({ ...phoneTemplate });
    await templateService.save(template);
    const model = Model.create({
      name: "model",
      userId: randomUUID(),
      organizationId: randomUUID(),
      template,
    });
    const item = Item.create({
      organizationId,
      userId: authContext.keycloakUser.sub,
      template,
      model,
    });
    const { uuid } = item.createUniqueProductIdentifier("externalId");
    await itemsService.save(item);

    const response = await request(app.getHttpServer())
      .get(`/unique-product-identifiers/${uuid}/metadata`)
      .set("service_token", serviceToken);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      organizationId,
    });
  });

  it(`/GET fails to return organizationId of unique product identifier if service token invalid`, async () => {
    jest
      .spyOn(reflector, "get")
      .mockImplementation(key => key === ALLOW_SERVICE_ACCESS);

    const response = await request(app.getHttpServer())
      .get(`/unique-product-identifiers/${randomUUID()}/metadata`)
      .set("service_token", "invalid_token");
    expect(response.status).toEqual(401);
  });

  it(`/GET model reference of unique product identifier`, async () => {
    const template = Template.loadFromDb({ ...phoneTemplate });
    await templateService.save(template);
    const model = Model.create({
      name: "model",
      userId: randomUUID(),
      organizationId,
      template,
    });
    const { uuid } = model.createUniqueProductIdentifier();
    await modelsService.save(model);
    const response = await request(app.getHttpServer())
      .get(
        `/organizations/${organizationId}/unique-product-identifiers/${uuid}/reference`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organizationId],
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: model.id,
      organizationId,
      granularityLevel: GranularityLevel.MODEL,
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
