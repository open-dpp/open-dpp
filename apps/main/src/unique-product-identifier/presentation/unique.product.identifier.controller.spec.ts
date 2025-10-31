import type { INestApplication } from "@nestjs/common";
import type { TemplateDbProps } from "../../templates/domain/template";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import {
  MongooseTestingModule,
} from "@open-dpp/testing";
import request from "supertest";
import { BetterAuthTestingGuard, getBetterAuthToken } from "../../../test/better-auth-testing.guard";
import TestUsersAndOrganizations from "../../../test/test-users-and-orgs";
import { ALLOW_SERVICE_ACCESS } from "../../auth/allow-service-access.decorator";
import { AuthService } from "../../auth/auth.service";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { EmailService } from "../../email/email.service";
import { Item } from "../../items/domain/item";
import { ItemDoc, ItemSchema } from "../../items/infrastructure/item.schema";
import { ItemsService } from "../../items/infrastructure/items.service";
import { Model } from "../../models/domain/model";
import { ModelDoc, ModelSchema } from "../../models/infrastructure/model.schema";
import { ModelsService } from "../../models/infrastructure/models.service";
import { OrganizationDbSchema, OrganizationDoc } from "../../organizations/infrastructure/organization.schema";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import { phoneFactory } from "../../product-passport/fixtures/product-passport.factory";
import { Template } from "../../templates/domain/template";
import { TemplateDoc, TemplateSchema } from "../../templates/infrastructure/template.schema";
import { TemplateService } from "../../templates/infrastructure/template.service";
import { UsersService } from "../../users/infrastructure/users.service";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "../infrastructure/unique-product-identifier.service";
import { UniqueProductIdentifierApplicationService } from "./unique.product.identifier.application.service";
import { UniqueProductIdentifierController } from "./unique.product.identifier.controller";

describe("uniqueProductIdentifierController", () => {
  let app: INestApplication;
  let modelsService: ModelsService;
  let itemsService: ItemsService;
  const serviceToken = "serviceToken";

  let templateService: TemplateService;
  const reflector: Reflector = new Reflector();
  let organizationService: OrganizationsService;

  const betterAuthTestingGuard = new BetterAuthTestingGuard(reflector);
  betterAuthTestingGuard.loadUsers([TestUsersAndOrganizations.users.user1, TestUsersAndOrganizations.users.user2]);
  betterAuthTestingGuard.addServiceToken(serviceToken, TestUsersAndOrganizations.users.user1);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
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
          {
            name: OrganizationDoc.name,
            schema: OrganizationDbSchema,
          },
        ]),
      ],
      providers: [
        UsersService,
        OrganizationsService,
        ModelsService,
        UniqueProductIdentifierService,
        UniqueProductIdentifierApplicationService,
        ItemsService,
        TemplateService,
        {
          provide: EmailService,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            getSession: jest.fn(),
            getUserById: jest.fn(),
          },
        },
        {
          provide: APP_GUARD,
          useValue: betterAuthTestingGuard,
        },
      ],
      controllers: [UniqueProductIdentifierController],
    })
      .compile();

    modelsService = moduleRef.get(ModelsService);
    itemsService = moduleRef.get(ItemsService);
    templateService = moduleRef.get<TemplateService>(TemplateService);
    organizationService = moduleRef.get(OrganizationsService);

    app = moduleRef.createNestApplication();

    await app.init();

    await organizationService.save(TestUsersAndOrganizations.organizations.org1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org2);
  });
  beforeEach(() => {
    jest.spyOn(reflector, "get").mockReturnValue(false);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const phoneTemplate: TemplateDbProps = phoneFactory
    .addSections()
    .build({
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
    });

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
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
      model,
    });
    const { uuid } = item.createUniqueProductIdentifier("externalId");
    await itemsService.save(item);

    const response = await request(app.getHttpServer())
      .get(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/unique-product-identifiers/${uuid}/reference`,
      )
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: item.id,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
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
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      template,
    });
    await modelsService.save(model);
    const item = Item.create({
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
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
      modelId: model.id,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      passportId: item.id,
      templateId: template.id,
    });
  });

  it(`/GET fails to return organizationId of unique product identifier if service token invalid`, async () => {
    jest
      .spyOn(reflector, "get")
      .mockImplementation(key => key === ALLOW_SERVICE_ACCESS);

    const response = await request(app.getHttpServer())
      .get(`/unique-product-identifiers/${randomUUID()}/metadata`)
      .set("service_token", "invalid_token");
    expect(response.status).toEqual(403);
  });

  it(`/GET model reference of unique product identifier`, async () => {
    const template = Template.loadFromDb({ ...phoneTemplate });
    await templateService.save(template);
    const model = Model.create({
      name: "model",
      userId: randomUUID(),
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      template,
    });
    const { uuid } = model.createUniqueProductIdentifier();
    await modelsService.save(model);
    const response = await request(app.getHttpServer())
      .get(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/unique-product-identifiers/${uuid}/reference`,
      )
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: model.id,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      granularityLevel: GranularityLevel.MODEL,
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
