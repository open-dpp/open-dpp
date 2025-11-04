import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { TemplateDbProps } from "../../templates/domain/template";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { IS_PUBLIC } from "@open-dpp/auth";
import { EnvModule } from "@open-dpp/env";
import { KeycloakAuthTestingGuard, MongooseTestingModule } from "@open-dpp/testing";
import request from "supertest";
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
  const reflector: Reflector = new Reflector();
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(
    new Map(),
    reflector,
  );
  const userId = randomUUID();
  const organizationId = randomUUID();
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [EnvModule.forRoot(), MongooseTestingModule, ProductPassportModule],
      providers: [
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
      ],
    }).compile();

    modelsService = module.get(ModelsService);
    itemsService = module.get(ItemsService);
    templateService = module.get<TemplateService>(TemplateService);

    app = module.createNestApplication();

    await app.init();
  });
  beforeEach(() => {
    jest.spyOn(reflector, "get").mockReturnValue(false);
  });
  const authProps = { userId, organizationId };
  const phoneTemplate: TemplateDbProps = phoneFactory
    .addSections()
    .build(authProps);

  it(`/GET public view for unique product identifier`, async () => {
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
    jest.spyOn(reflector, "get").mockImplementation(key => key === IS_PUBLIC);

    const response = await request(app.getHttpServer()).get(
      `/product-passports/${uuid}`,
    );
    expect(response.status).toEqual(200);

    const productPassport = ProductPassport.create({
      uniqueProductIdentifier: item.uniqueProductIdentifiers[0],
      template,
      model,
      item,
    });
    expect(response.body).toEqual(productPassportToDto(productPassport));
  });

  afterAll(async () => {
    await module.close();
    await app.close();
  });
});
