import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { getApp, ignoreIds } from "@open-dpp/testing";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";
import { DataFieldType } from "../../data-modelling/domain/data-field-base";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { SectionType } from "../../data-modelling/domain/section-base";
import { Sector } from "../../data-modelling/domain/sectors";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AasConnectionDoc, AasConnectionSchema } from "../../integrations/infrastructure/aas-connection.schema";
import {
  PassportTemplatePublicationDbSchema,
  PassportTemplatePublicationDoc,
} from "../../marketplace/infrastructure/passport-template-publication.schema";
import {
  PassportTemplatePublicationService,
} from "../../marketplace/infrastructure/passport-template-publication.service";
import { MarketplaceApplicationService } from "../../marketplace/presentation/marketplace.application.service";
import { Model } from "../../models/domain/model";
import { ModelDoc, ModelSchema } from "../../models/infrastructure/model.schema";
import { ModelsService } from "../../models/infrastructure/models.service";
import { DataValue } from "../../product-passport-data/domain/data-value";
import { Template, TemplateDbProps } from "../../templates/domain/template";
import { TemplateDoc, TemplateSchema } from "../../templates/infrastructure/template.schema";
import { TemplateService } from "../../templates/infrastructure/template.service";
import {
  DppEventSchema,
  TraceabilityEventDocument,
} from "../../traceability-events/infrastructure/traceability-event.document";
import { TraceabilityEventsService } from "../../traceability-events/infrastructure/traceability-events.service";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { Item } from "../domain/item";
import { ItemDoc, ItemSchema } from "../infrastructure/item.schema";
import { ItemsService } from "../infrastructure/items.service";
import { ItemsApplicationService } from "./items-application.service";
import { ItemsController } from "./items.controller";

async function createTemplate(userId: string, organizationId: string, templateService: TemplateService) {
  const sectionId1 = randomUUID();
  const sectionId2 = randomUUID();
  const sectionId3 = randomUUID();
  const dataFieldId1 = randomUUID();
  const dataFieldId2 = randomUUID();
  const dataFieldId3 = randomUUID();
  const dataFieldId4 = randomUUID();
  const dataFieldId5 = randomUUID();
  const laptopModel: TemplateDbProps = {
    id: randomUUID(),
    marketplaceResourceId: null,
    name: "Laptop",
    description: "My laptop",
    sectors: [Sector.ELECTRONICS],
    version: "1.0",
    organizationId,
    userId,
    sections: [
      {
        type: SectionType.GROUP,
        id: sectionId1,
        name: "Section name",
        parentId: undefined,
        subSections: [],
        dataFields: [
          {
            type: DataFieldType.TEXT_FIELD,
            id: dataFieldId1,
            name: "Title",
            options: { min: 2 },
            granularityLevel: GranularityLevel.ITEM,
          },
          {
            type: DataFieldType.TEXT_FIELD,
            id: dataFieldId2,
            name: "Title 2",
            options: { min: 7 },
            granularityLevel: GranularityLevel.ITEM,
          },
        ],
      },
      {
        type: SectionType.GROUP,
        id: sectionId2,
        name: "Section name 2",
        parentId: undefined,
        subSections: [],
        dataFields: [
          {
            type: DataFieldType.TEXT_FIELD,
            id: dataFieldId3,
            name: "Title 3",
            options: { min: 8 },
            granularityLevel: GranularityLevel.ITEM,
          },
        ],
      },
      {
        type: SectionType.REPEATABLE,
        id: sectionId3,
        name: "Repeating Section",
        parentId: undefined,
        subSections: [],
        dataFields: [
          {
            type: DataFieldType.TEXT_FIELD,
            id: dataFieldId4,
            name: "Title 4",
            options: { min: 8 },

            granularityLevel: GranularityLevel.ITEM,
          },
          {
            type: DataFieldType.TEXT_FIELD,
            id: dataFieldId5,
            name: "Title 5",
            options: { min: 8 },
            granularityLevel: GranularityLevel.ITEM,
          },
        ],
      },
    ],
  };
  const template = Template.loadFromDb(laptopModel);
  await templateService.save(template);
  const expectedDataValues = [
    {
      dataSectionId: sectionId1,
      dataFieldId: dataFieldId1,
      value: undefined,
      row: 0,
    },
    {
      dataSectionId: sectionId1,
      dataFieldId: dataFieldId2,
      value: undefined,
      row: 0,
    },
    {
      dataSectionId: sectionId2,
      dataFieldId: dataFieldId3,
      value: undefined,
      row: 0,
    },
  ];
  return {
    template,
    expectedDataValues,
  };
}

describe("itemsController", () => {
  let app: INestApplication;
  let itemsService: ItemsService;
  let modelsService: ModelsService;
  let templateService: TemplateService;
  let uniqueProductIdentifierService: UniqueProductIdentifierService;
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
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
          {
            name: AasConnectionDoc.name,
            schema: AasConnectionSchema,
          },
          {
            name: TraceabilityEventDocument.name,
            schema: DppEventSchema,
          },
          {
            name: PassportTemplatePublicationDoc.name,
            schema: PassportTemplatePublicationDbSchema,
          },
        ]),
        AuthModule,
      ],
      providers: [
        ModelsService,
        ItemsService,
        UniqueProductIdentifierService,
        TemplateService,
        MarketplaceApplicationService,
        PassportTemplatePublicationService,
        ItemsApplicationService,
        TraceabilityEventsService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [ItemsController],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    modelsService = moduleRef.get(ModelsService);
    itemsService = moduleRef.get(ItemsService);
    templateService = moduleRef.get(TemplateService);
    uniqueProductIdentifierService = moduleRef.get(
      UniqueProductIdentifierService,
    );
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

  it(`/CREATE item`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { template, expectedDataValues } = await createTemplate(user.id, org.id, templateService);
    const model = Model.create({
      name: "name",
      userId: user.id,
      organizationId: org.id,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .post(`/organizations/${org.id}/models/${model.id}/items`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(201);
    const found = await itemsService.findOneOrFail(response.body.id);
    const foundUniqueProductIdentifiers
      = await uniqueProductIdentifierService.findAllByReferencedId(found.id);
    expect(foundUniqueProductIdentifiers).toHaveLength(1);
    expect(response.body).toEqual({
      id: found.id,
      uniqueProductIdentifiers: [
        {
          uuid: foundUniqueProductIdentifiers[0].uuid,
          referenceId: found.id,
        },
      ],
      dataValues: expectedDataValues,
      templateId: model.templateId,
    });
  });

  it(`/CREATE item fails if user is not member of organization`, async () => {
    const { user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { template } = await createTemplate(user.id, org2.id, templateService);
    const model = Model.create({
      name: "name",
      userId: user.id,
      organizationId: org2.id,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .post(`/organizations/${org2.id}/models/${model.id}/items`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(403);
  });

  it(`/CREATE item fails if model does not belong to organization`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { template } = await createTemplate(user.id, org.id, templateService);
    const model = Model.create({
      name: "name",
      userId: user.id,
      organizationId: org2.id,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .post(`/organizations/${org.id}/models/${model.id}/items`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(403);
  });

  it("add data values to item", async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { template } = await createTemplate(user.id, org.id, templateService);
    const model = Model.create({
      name: "name",
      userId: user.id,
      organizationId: org.id,
      template,
    });
    const item = Item.create({ organizationId: org.id, userId: user.id, model, template });
    item.createUniqueProductIdentifier();
    await itemsService.save(item);
    const existingDataValues = item.dataValues;
    const addedValues = [
      {
        dataSectionId: randomUUID(),
        dataFieldId: randomUUID(),
        value: "value 4",
        row: 0,
      },
      {
        dataSectionId: randomUUID(),
        dataFieldId: randomUUID(),
        value: "value 5",
        row: 0,
      },
    ];
    const response = await request(getApp(app))
      .post(
        `/organizations/${org.id}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set("Cookie", userCookie)
      .send(addedValues);
    expect(response.status).toEqual(201);
    const expected = [
      ...existingDataValues,
      ...addedValues.map(d => DataValue.create(d)),
    ];
    expect(response.body.dataValues).toEqual(ignoreIds(expected));

    const foundItem = await itemsService.findOneOrFail(response.body.id);

    expect(foundItem.dataValues).toEqual(response.body.dataValues);
  });

  it("add data values to item fails if user is not member of organization", async () => {
    const { user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { template } = await createTemplate(user.id, org2.id, templateService);
    const model = Model.create({
      name: "name",
      userId: user.id,
      organizationId: org2.id,
      template,
    });
    const item = Item.create({
      organizationId: org2.id,
      userId: user.id,
      template,
      model,
    });
    await itemsService.save(item);
    const addedValues: Array<any> = [];
    const response = await request(getApp(app))
      .post(
        `/organizations/${org2.id}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set("Cookie", userCookie)
      .send(addedValues);
    expect(response.status).toEqual(403);
  });

  it("update data values of item", async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { template } = await createTemplate(user.id, org.id, templateService);
    const model = Model.create({
      name: "name",
      userId: user.id,
      organizationId: org.id,
      template,
    });
    const item = Item.create({
      organizationId: org.id,
      userId: user.id,
      template,
      model,
    });

    item.createUniqueProductIdentifier();

    const dataValue1 = item.dataValues[0];
    const dataValue2 = item.dataValues[1];
    const dataValue3 = item.dataValues[2];
    const updatedValues = [
      {
        dataFieldId: dataValue1.dataFieldId,
        dataSectionId: dataValue1.dataSectionId,
        value: "value 1",
        row: 0,
      },
      {
        dataFieldId: dataValue3.dataFieldId,
        dataSectionId: dataValue3.dataSectionId,
        value: "value 3",
        row: 0,
      },
    ];
    await itemsService.save(item);
    const response = await request(getApp(app))
      .patch(
        `/organizations/${org.id}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set("Cookie", userCookie)
      .send(updatedValues);
    expect(response.status).toEqual(200);
    const expectedDataValues = [
      {
        ...dataValue1,
        value: "value 1",
      },
      {
        ...dataValue2,
      },
      {
        ...dataValue3,
        value: "value 3",
      },
    ];
    expect(response.body.dataValues).toEqual(expectedDataValues);
    const foundItem = await itemsService.findOneOrFail(response.body.id);
    expect(foundItem.dataValues).toEqual(expectedDataValues);
  });

  it("update data values fails if user is not member of organization", async () => {
    const { user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { template } = await createTemplate(user.id, org2.id, templateService);
    const model = Model.create({
      name: "name",
      userId: user.id,
      organizationId: org2.id,
      template,
    });
    const item = Item.create({
      organizationId: org2.id,
      userId: user.id,
      template,
      model,
    });
    await itemsService.save(item);
    const updatedValues = [
      {
        dataFieldId: randomUUID(),
        dataSectionId: randomUUID(),
        value: "value 1",
        row: 0,
      },
    ];
    const response = await request(getApp(app))
      .patch(
        `/organizations/${org2.id}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set("Cookie", userCookie)
      .send(updatedValues);
    expect(response.status).toEqual(403);
  });

  it("update data values fails if item does not belong to organization", async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { template } = await createTemplate(user.id, org.id, templateService);
    const model = Model.create({
      name: "name",
      userId: user.id,
      organizationId: org.id,
      template,
    });
    const item = Item.create({
      organizationId: org2.id,
      userId: user.id,
      template,
      model,
    });
    await itemsService.save(item);
    const updatedValues = [
      {
        dataFieldId: randomUUID(),
        dataSectionId: randomUUID(),
        value: "value 1",
        row: 0,
      },
    ];

    const response = await request(getApp(app))
      .patch(
        `/organizations/${org.id}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set("Cookie", userCookie)
      .send(updatedValues);
    expect(response.status).toEqual(403);
  });

  it(`/GET item`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { template, expectedDataValues } = await createTemplate(user.id, org.id, templateService);
    const model = Model.create({
      name: "name",
      userId: user.id,
      organizationId: org.id,
      template,
    });
    await modelsService.save(model);
    const item = Item.create({
      organizationId: org.id,
      userId: user.id,
      model,
      template,
    });
    const uniqueProductId = item.createUniqueProductIdentifier();
    await itemsService.save(item);
    const response = await request(getApp(app))
      .get(
        `/organizations/${org.id}/models/${model.id}/items/${item.id}`,
      )
      .set("Cookie", userCookie);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: item.id,
      uniqueProductIdentifiers: [
        {
          referenceId: item.id,
          uuid: uniqueProductId.uuid,
        },
      ],
      dataValues: expectedDataValues,
      templateId: model.templateId,
    });
  });
  //
  it(`/GET item fails if user is not member of organization`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { template } = await createTemplate(user.id, org.id, templateService);
    const model = Model.create({
      name: "name",
      userId: user.id,
      organizationId: org2.id,
      template,
    });
    const item = Item.create({
      organizationId: org2.id,
      userId: user.id,
      template,
      model,
    });

    await itemsService.save(item);
    const response = await request(getApp(app))
      .get(
        `/organizations/${org.id}/models/${model.id}/items/${item.id}`,
      )
      .set("Cookie", userCookie);
    expect(response.status).toEqual(403);
  });

  it(`/GET item fails if item does not belong to organization`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { template } = await createTemplate(user.id, org.id, templateService);
    const model = Model.create({
      name: "name",
      userId: user.id,
      organizationId: org.id,
      template,
    });
    const item = Item.create({
      organizationId: org2.id,
      userId: user.id,
      template,
      model,
    });

    await itemsService.save(item);
    const response = await request(getApp(app))
      .get(
        `/organizations/${org.id}/models/${model.id}/items/${item.id}`,
      )
      .set("Cookie", userCookie);
    expect(response.status).toEqual(403);
  });

  it(`/GET all item`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { template, expectedDataValues } = await createTemplate(user.id, org.id, templateService);
    const model = Model.create({
      name: "name",
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
    const uniqueProductId1 = item.createUniqueProductIdentifier();
    await itemsService.save(item);
    const item2 = Item.create({
      organizationId: org.id,
      userId: user.id,
      template,
      model,
    });
    const uniqueProductId2 = item2.createUniqueProductIdentifier();
    await itemsService.save(item2);
    const response = await request(getApp(app))
      .get(`/organizations/${org.id}/models/${model.id}/items`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual([
      {
        id: item.id,
        uniqueProductIdentifiers: [
          {
            referenceId: item.id,
            uuid: uniqueProductId1.uuid,
          },
        ],
        dataValues: expectedDataValues,
        templateId: model.templateId,
      },
      {
        id: item2.id,
        uniqueProductIdentifiers: [
          {
            referenceId: item2.id,
            uuid: uniqueProductId2.uuid,
          },
        ],
        dataValues: expectedDataValues,
        templateId: model.templateId,
      },
    ]);
  });
  //
  it(`/GET all item fails if user is not member of organization`, async () => {
    const { user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { template } = await createTemplate(user.id, org2.id, templateService);
    const model = Model.create({
      name: "name",
      userId: user.id,
      organizationId: org2.id,
      template,
    });
    await modelsService.save(model);
    const item = Item.create({
      organizationId: org2.id,
      userId: user.id,
      template,
      model,
    });
    await itemsService.save(item);
    const response = await request(getApp(app))
      .get(`/organizations/${org2.id}/models/${model.id}/items`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(403);
  });

  it(`/GET all item fails if model do not belong to organization`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { template } = await createTemplate(user.id, org.id, templateService);
    const model = Model.create({
      name: "name",
      userId: user.id,
      organizationId: org2.id,
      template,
    });
    await modelsService.save(model);
    const item = Item.create({
      organizationId: org.id,
      userId: user.id,
      template,
      model,
    });
    await itemsService.save(item);
    const response = await request(getApp(app))
      .get(`/organizations/${org.id}/models/${model.id}/items`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(403);
  });

  afterAll(async () => {
    await app.close();
  });
});
