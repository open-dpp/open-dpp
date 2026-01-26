import type { INestApplication } from "@nestjs/common";
import type { TemplateDbProps } from "../../old-templates/domain/template";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";

import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AuthGuard } from "../../identity/auth/auth.guard";
import { AuthModule } from "../../identity/auth/auth.module";
import { AuthService } from "../../identity/auth/auth.service";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { Item } from "../../items/domain/item";
import { ItemDoc, ItemSchema } from "../../items/infrastructure/item.schema";
import { ItemsService } from "../../items/infrastructure/items.service";
import { Model } from "../../models/domain/model";
import { ModelDoc, ModelSchema } from "../../models/infrastructure/model.schema";
import { ModelsService } from "../../models/infrastructure/models.service";
import { Template } from "../../old-templates/domain/template";
import { OldTemplateDoc, TemplateSchema } from "../../old-templates/infrastructure/template.schema";
import { TemplateService } from "../../old-templates/infrastructure/template.service";
import { phoneFactory } from "../../product-passport/fixtures/product-passport.factory";
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
  let templateService: TemplateService;
  let configService: EnvService;
  let authService: AuthService;

  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
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
            name: OldTemplateDoc.name,
            schema: TemplateSchema,
          },
        ]),
        AuthModule,
      ],
      providers: [
        ModelsService,
        UniqueProductIdentifierService,
        UniqueProductIdentifierApplicationService,
        ItemsService,
        TemplateService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [UniqueProductIdentifierController],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    modelsService = moduleRef.get(ModelsService);
    itemsService = moduleRef.get(ItemsService);
    templateService = moduleRef.get<TemplateService>(TemplateService);
    configService = moduleRef.get<EnvService>(EnvService);
    authService = moduleRef.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    app = moduleRef.createNestApplication();

    await app.init();

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  it(`/GET reference of unique product identifier`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const phoneTemplate: TemplateDbProps = phoneFactory
      .addSections()
      .build({
        userId: user.id,
        organizationId: org.id,
      });
    const template = Template.loadFromDb({ ...phoneTemplate });
    await templateService.save(template);
    const model = Model.create({
      name: "model",
      userId: randomUUID(),
      organizationId: randomUUID(),
      template,
    });
    const item = Item.create({
      organizationId: org.id,
      userId: user.id,
      template,
      model,
    });
    const { uuid } = item.createUniqueProductIdentifier("externalId");
    await itemsService.save(item);

    const response = await request(app.getHttpServer())
      .get(
        `/organizations/${org.id}/unique-product-identifiers/${uuid}/reference`,
      )
      .set("Cookie", userCookie);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: item.id,
      organizationId: org.id,
      modelId: model.id,
      granularityLevel: GranularityLevel.ITEM,
    });
  });

  it(`/GET organizationId of unique product identifier`, async () => {
    const { org, user } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const phoneTemplate: TemplateDbProps = phoneFactory
      .addSections()
      .build({
        userId: user.id,
        organizationId: org.id,
      });

    const template = Template.loadFromDb({ ...phoneTemplate });
    await templateService.save(template);
    const model = Model.create({
      name: "model",
      userId: user.id,
      organizationId: org.id,
      template,
    });
    await modelsService.save(model);
    const item = Item.create({
      organizationId: org.id,
      userId: user.id,
      template,
      model,
    });
    const { uuid } = item.createUniqueProductIdentifier("externalId");
    await itemsService.save(item);

    const response = await request(app.getHttpServer())
      .get(`/unique-product-identifiers/${uuid}/metadata`)
      .set("service_token", configService.get("OPEN_DPP_SERVICE_TOKEN"));

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      modelId: model.id,
      organizationId: org.id,
      passportId: item.id,
      templateId: template.id,
    });
  });

  it(`/GET fails to return organizationId of unique product identifier if service token invalid`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/unique-product-identifiers/${randomUUID()}/metadata`)
      .set("service_token", "invalid_token");
    expect(response.status).toEqual(403);
  });

  it(`/GET model reference of unique product identifier`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const phoneTemplate: TemplateDbProps = phoneFactory
      .addSections()
      .build({
        userId: user.id,
        organizationId: org.id,
      });
    const template = Template.loadFromDb({ ...phoneTemplate });
    await templateService.save(template);
    const model = Model.create({
      name: "model",
      userId: randomUUID(),
      organizationId: org.id,
      template,
    });
    const { uuid } = model.createUniqueProductIdentifier();
    await modelsService.save(model);
    const response = await request(app.getHttpServer())
      .get(
        `/organizations/${org.id}/unique-product-identifiers/${uuid}/reference`,
      )
      .set("Cookie", userCookie);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: model.id,
      organizationId: org.id,
      granularityLevel: GranularityLevel.MODEL,
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
