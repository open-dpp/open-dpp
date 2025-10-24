import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import { getApp, ignoreIds, MongooseTestingModule } from "@open-dpp/testing";
import request from "supertest";
import { BetterAuthTestingGuard, getBetterAuthToken } from "../../../test/better-auth-testing.guard";
import TestUsersAndOrganizations from "../../../test/test-users-and-orgs";
import { AuthService } from "../../auth/auth.service";
import { DataFieldType } from "../../data-modelling/domain/data-field-base";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { SectionType } from "../../data-modelling/domain/section-base";
import { Sector } from "../../data-modelling/domain/sectors";
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
import { OrganizationDbSchema, OrganizationDoc } from "../../organizations/infrastructure/organization.schema";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
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
import { UsersService } from "../../users/infrastructure/users.service";
import { Item } from "../domain/item";
import { ItemDoc, ItemSchema } from "../infrastructure/item.schema";
import { ItemsService } from "../infrastructure/items.service";
import { ItemsApplicationService } from "./items-application.service";
import { ItemsController } from "./items.controller";

describe("itemsController", () => {
  let app: INestApplication;
  let itemsService: ItemsService;
  let modelsService: ModelsService;
  let templateService: TemplateService;
  let uniqueProductIdentifierService: UniqueProductIdentifierService;
  const betterAuthTestingGuard = new BetterAuthTestingGuard(new Reflector());
  betterAuthTestingGuard.loadUsers([TestUsersAndOrganizations.users.user1, TestUsersAndOrganizations.users.user2]);

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
    organizationId: TestUsersAndOrganizations.organizations.org1.id,
    userId: TestUsersAndOrganizations.users.user1.id,
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
          {
            name: OrganizationDoc.name,
            schema: OrganizationDbSchema,
          },
        ]),
      ],
      providers: [
        OrganizationsService,
        UsersService,
        ModelsService,
        ItemsService,
        UniqueProductIdentifierService,
        TemplateService,
        MarketplaceApplicationService,
        PassportTemplatePublicationService,
        ItemsApplicationService,
        TraceabilityEventsService,
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
      controllers: [ItemsController],
    })
      .compile();

    modelsService = moduleRef.get(ModelsService);
    itemsService = moduleRef.get(ItemsService);
    templateService = moduleRef.get(TemplateService);
    uniqueProductIdentifierService = moduleRef.get(
      UniqueProductIdentifierService,
    );
    const organizationService = moduleRef.get(OrganizationsService);

    app = moduleRef.createNestApplication();
    await templateService.save(template);
    await app.init();

    await organizationService.save(TestUsersAndOrganizations.organizations.org1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org2);
  });

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

  it(`/CREATE item`, async () => {
    const model = Model.create({
      name: "name",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .post(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/items`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
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
    const model = Model.create({
      name: "name",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .post(`/organizations/${TestUsersAndOrganizations.organizations.org2.id}/models/${model.id}/items`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/CREATE item fails if model does not belong to organization`, async () => {
    const model = Model.create({
      name: "name",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .post(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/items`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it("add data values to item", async () => {
    const model = Model.create({
      name: "name",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      template,
    });
    const item = Item.create({ organizationId: TestUsersAndOrganizations.organizations.org1.id, userId: TestUsersAndOrganizations.users.user1.id, model, template });
    item.createUniqueProductIdentifier();
    await itemsService.save(item);
    const existingDataValues = item.dataValues;
    const addedValues = [
      {
        dataSectionId: sectionId3,
        dataFieldId: dataFieldId4,
        value: "value 4",
        row: 0,
      },
      {
        dataSectionId: sectionId3,
        dataFieldId: dataFieldId5,
        value: "value 5",
        row: 0,
      },
    ];
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
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
    const model = Model.create({
      name: "name",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      template,
    });
    const item = Item.create({
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
      model,
    });
    await itemsService.save(item);
    const addedValues: Array<any> = [];
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
      .send(addedValues);
    expect(response.status).toEqual(403);
  });

  it("update data values of item", async () => {
    const model = Model.create({
      name: "name",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      template,
    });
    const item = Item.create({
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
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
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
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
    const model = Model.create({
      name: "name",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      template,
    });
    const item = Item.create({
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      userId: TestUsersAndOrganizations.users.user1.id,
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
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
      .send(updatedValues);
    expect(response.status).toEqual(403);
  });

  it("update data values fails if item does not belong to organization", async () => {
    const model = Model.create({
      name: "name",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      template,
    });
    const item = Item.create({
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      userId: TestUsersAndOrganizations.users.user1.id,
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
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
      .send(updatedValues);
    expect(response.status).toEqual(403);
  });

  it(`/GET item`, async () => {
    const model = Model.create({
      name: "name",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      template,
    });
    await modelsService.save(model);
    const item = Item.create({
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      model,
      template,
    });
    const uniqueProductId = item.createUniqueProductIdentifier();
    await itemsService.save(item);
    const response = await request(getApp(app))
      .get(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/items/${item.id}`,
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
    const model = Model.create({
      name: "name",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      template,
    });
    const item = Item.create({
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
      model,
    });

    await itemsService.save(item);
    const response = await request(getApp(app))
      .get(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/items/${item.id}`,
      )
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/GET item fails if item does not belong to organization`, async () => {
    const model = Model.create({
      name: "name",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      template,
    });
    const item = Item.create({
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
      model,
    });

    await itemsService.save(item);
    const response = await request(getApp(app))
      .get(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/items/${item.id}`,
      )
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/GET all item`, async () => {
    const model = Model.create({
      name: "name",
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
    const uniqueProductId1 = item.createUniqueProductIdentifier();
    await itemsService.save(item);
    const item2 = Item.create({
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
      model,
    });
    const uniqueProductId2 = item2.createUniqueProductIdentifier();
    await itemsService.save(item2);
    const response = await request(getApp(app))
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/items`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
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
    const model = Model.create({
      name: "name",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      template,
    });
    await modelsService.save(model);
    const item = Item.create({
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
      model,
    });
    await itemsService.save(item);
    const response = await request(getApp(app))
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org2.id}/models/${model.id}/items`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/GET all item fails if model do not belong to organization`, async () => {
    const model = Model.create({
      name: "name",
      userId: TestUsersAndOrganizations.users.user1.id,
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      template,
    });
    await modelsService.save(model);
    const item = Item.create({
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
      model,
    });
    await itemsService.save(item);
    const response = await request(getApp(app))
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/items`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(403);
  });

  afterAll(async () => {
    await app.close();
  });
});
