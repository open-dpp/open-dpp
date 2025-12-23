import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { TemplateDbProps } from "../../templates/domain/template";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { Item } from "../../items/domain/item";
import { ItemsService } from "../../items/infrastructure/items.service";
import { Model } from "../../models/domain/model";
import { ModelsService } from "../../models/infrastructure/models.service";
import { Template } from "../../templates/domain/template";
import { TemplateService } from "../../templates/infrastructure/template.service";
import { ProductPassport } from "../domain/product-passport";
import {
  phoneFactory,
  phoneItemFactory,
  phoneModelFactory,
} from "../fixtures/product-passport.factory";
import { ProductPassportModule } from "../product-passport.module";
import { productPassportToDto } from "./dto/product-passport.dto";

describe("productPassportController", () => {
  let app: INestApplication;
  let modelsService: ModelsService;
  let itemsService: ItemsService;
  let templateService: TemplateService;
  let authService: AuthService;

  const betterAuthHelper = new BetterAuthHelper();

  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        AuthModule,
        ProductPassportModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    modelsService = module.get(ModelsService);
    itemsService = module.get(ItemsService);
    templateService = module.get<TemplateService>(TemplateService);
    authService = module.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    app = module.createNestApplication();

    await app.init();
  });

  it(`/GET public view for unique product identifier`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const authProps = { userId: user.id, organizationId: org.id };
    const phoneTemplate: TemplateDbProps = phoneFactory
      .addSections()
      .build(authProps);
    const template = Template.loadFromDb({ ...phoneTemplate });
    await templateService.save(template);
    const mediaReferences = [randomUUID(), randomUUID(), randomUUID()];

    const model = Model.loadFromDb(
      phoneModelFactory
        .addDataValues()
        .build({ ...authProps, templateId: template.id, mediaReferences }),
    );

    const item = Item.loadFromDb(
      phoneItemFactory
        .addDataValues()
        .build({ ...authProps, modelId: model.id, templateId: template.id }),
    );
    model.createUniqueProductIdentifier();
    const uuid = item.uniqueProductIdentifiers[0].uuid;
    await itemsService.save(item);
    await modelsService.save(model);

    const response = await request(app.getHttpServer()).get(
      `/product-passports/${uuid}`,
    ).set("Cookie", userCookie);
    expect(response.status).toEqual(200);

    const productPassport = ProductPassport.create({
      uniqueProductIdentifier: item.uniqueProductIdentifiers[0],
      template,
      model,
      item,
      organizationName: org.name,
      organizationImage: "org-image-media-id",
    });
    expect(response.body).toEqual(productPassportToDto(productPassport));
  });

  afterAll(async () => {
    await module.close();
    await app.close();
  });
});
