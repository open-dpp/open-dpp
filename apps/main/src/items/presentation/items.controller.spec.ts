import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { AuthContext, PermissionModule } from "@open-dpp/auth";
import { EnvModule } from "@open-dpp/env";
import getKeycloakAuthToken, { createKeycloakUserInToken, getApp, ignoreIds, KeycloakAuthTestingGuard, KeycloakResourcesServiceTesting, MongooseTestingModule, TypeOrmTestingModule } from "@open-dpp/testing";
import request from "supertest";
import { DataFieldType } from "../../data-modelling/domain/data-field-base";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { SectionType } from "../../data-modelling/domain/section-base";
import { Sector } from "../../data-modelling/domain/sectors";
import { AasConnectionDoc, AasConnectionSchema } from "../../integrations/infrastructure/aas-connection.schema";
import { KeycloakResourcesService } from "../../keycloak-resources/infrastructure/keycloak-resources.service";
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
import { Organization } from "../../organizations/domain/organization";
import { OrganizationEntity } from "../../organizations/infrastructure/organization.entity";
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
import { User } from "../../users/domain/user";
import { UserEntity } from "../../users/infrastructure/user.entity";
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
  let organizationsService: OrganizationsService;
  let uniqueProductIdentifierService: UniqueProductIdentifierService;
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(new Map());

  const authContext = new AuthContext();
  authContext.keycloakUser = createKeycloakUserInToken();
  const user = new User(
    authContext.keycloakUser.sub,
    authContext.keycloakUser.email,
  );
  const organization = Organization.create({
    name: "orga",
    user,
  });
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
    organizationId: organization.id,
    userId: authContext.keycloakUser.sub,
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
      ],
      providers: [
        OrganizationsService,
        UsersService,
        KeycloakResourcesService,
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
          useValue: keycloakAuthTestingGuard,
        },
        {
          provide: KeycloakResourcesService,
          useValue: KeycloakResourcesServiceTesting.fromPlain({
            users: [
              {
                id: authContext.keycloakUser.sub,
                email: authContext.keycloakUser.email,
              },
            ],
          }),
        },
      ],
      controllers: [ItemsController],
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
    templateService = moduleRef.get(TemplateService);
    uniqueProductIdentifierService = moduleRef.get(
      UniqueProductIdentifierService,
    );
    organizationsService = moduleRef.get(OrganizationsService);

    app = moduleRef.createNestApplication();
    await templateService.save(template);
    await app.init();
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
      userId: authContext.keycloakUser.sub,
      organizationId: organization.id,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .post(`/organizations/${organization.id}/models/${model.id}/items`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organization.id],
          keycloakAuthTestingGuard,
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
    const otherOrganizationId = randomUUID();

    const model = Model.create({
      name: "name",
      userId: authContext.keycloakUser.sub,
      organizationId: otherOrganizationId,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .post(`/organizations/${otherOrganizationId}/models/${model.id}/items`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organization.id],
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/CREATE item fails if model does not belong to organization`, async () => {
    const otherOrganizationId = randomUUID();

    const model = Model.create({
      name: "name",
      userId: authContext.keycloakUser.sub,
      organizationId: otherOrganizationId,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .post(`/organizations/${organization.id}/models/${model.id}/items`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organization.id],
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it("add data values to item", async () => {
    const organizationId = randomUUID();
    const userId = randomUUID();
    const model = Model.create({
      name: "name",
      userId: authContext.keycloakUser.sub,
      organizationId: organization.id,
      template,
    });
    const item = Item.create({ organizationId, userId, model, template });
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
        `/organizations/${organizationId}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organizationId],
          keycloakAuthTestingGuard,
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
    const otherOrganizationId = randomUUID();
    const model = Model.create({
      name: "name",
      userId: authContext.keycloakUser.sub,
      organizationId: organization.id,
      template,
    });
    const item = Item.create({
      organizationId: otherOrganizationId,
      userId: authContext.keycloakUser.sub,
      template,
      model,
    });
    await itemsService.save(item);
    const addedValues: Array<any> = [];
    const response = await request(getApp(app))
      .post(
        `/organizations/${otherOrganizationId}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organization.id],
          keycloakAuthTestingGuard,
        ),
      )
      .send(addedValues);
    expect(response.status).toEqual(403);
  });

  it("update data values of item", async () => {
    const model = Model.create({
      name: "name",
      userId: authContext.keycloakUser.sub,
      organizationId: organization.id,
      template,
    });
    const item = Item.create({
      organizationId: organization.id,
      userId: authContext.keycloakUser.sub,
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
        `/organizations/${organization.id}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organization.id],
          keycloakAuthTestingGuard,
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
    const otherOrganizationId = randomUUID();
    const model = Model.create({
      name: "name",
      userId: authContext.keycloakUser.sub,
      organizationId: organization.id,
      template,
    });
    const item = Item.create({
      organizationId: otherOrganizationId,
      userId: authContext.keycloakUser.sub,
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
        `/organizations/${otherOrganizationId}/models/${randomUUID()}/items/${item.id}/data-values`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organization.id],
          keycloakAuthTestingGuard,
        ),
      )
      .send(updatedValues);
    expect(response.status).toEqual(403);
  });

  it("update data values fails if item does not belong to organization", async () => {
    const otherOrganizationId = randomUUID();
    const model = Model.create({
      name: "name",
      userId: authContext.keycloakUser.sub,
      organizationId: organization.id,
      template,
    });
    const item = Item.create({
      organizationId: otherOrganizationId,
      userId: authContext.keycloakUser.sub,
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
        `/organizations/${organization.id}/models/${model.id}/items/${item.id}/data-values`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organization.id],
          keycloakAuthTestingGuard,
        ),
      )
      .send(updatedValues);
    expect(response.status).toEqual(403);
  });

  it(`/GET item`, async () => {
    const model = Model.create({
      name: "name",
      userId: authContext.keycloakUser.sub,
      organizationId: organization.id,
      template,
    });
    await modelsService.save(model);
    const item = Item.create({
      organizationId: organization.id,
      userId: authContext.keycloakUser.sub,
      model,
      template,
    });
    const uniqueProductId = item.createUniqueProductIdentifier();
    await itemsService.save(item);
    const response = await request(getApp(app))
      .get(
        `/organizations/${organization.id}/models/${model.id}/items/${item.id}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organization.id],
          keycloakAuthTestingGuard,
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
    const otherOrganizationId = randomUUID();
    const model = Model.create({
      name: "name",
      userId: authContext.keycloakUser.sub,
      organizationId: organization.id,
      template,
    });
    const item = Item.create({
      organizationId: otherOrganizationId,
      userId: authContext.keycloakUser.sub,
      template,
      model,
    });

    await itemsService.save(item);
    const response = await request(getApp(app))
      .get(
        `/organizations/${organization.id}/models/${model.id}/items/${item.id}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organization.id],
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/GET item fails if item does not belong to organization`, async () => {
    const otherOrganizationId = randomUUID();
    const model = Model.create({
      name: "name",
      userId: authContext.keycloakUser.sub,
      organizationId: organization.id,
      template,
    });
    const item = Item.create({
      organizationId: otherOrganizationId,
      userId: authContext.keycloakUser.sub,
      template,
      model,
    });

    await itemsService.save(item);
    const otherOrganization = Organization.create({
      name: "My orga",
      user,
    });
    await organizationsService.save(otherOrganization);
    const response = await request(getApp(app))
      .get(
        `/organizations/${organization.id}/models/${model.id}/items/${item.id}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organization.id],
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/GET all item`, async () => {
    const otherOrganizationId = randomUUID();
    const model = Model.create({
      name: "name",
      userId: authContext.keycloakUser.sub,
      organizationId: otherOrganizationId,
      template,
    });
    await modelsService.save(model);
    const item = Item.create({
      organizationId: otherOrganizationId,
      userId: authContext.keycloakUser.sub,
      template,
      model,
    });
    const uniqueProductId1 = item.createUniqueProductIdentifier();
    await itemsService.save(item);
    const item2 = Item.create({
      organizationId: otherOrganizationId,
      userId: authContext.keycloakUser.sub,
      template,
      model,
    });
    const uniqueProductId2 = item2.createUniqueProductIdentifier();
    await itemsService.save(item2);
    const response = await request(getApp(app))
      .get(`/organizations/${otherOrganizationId}/models/${model.id}/items`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [otherOrganizationId],
          keycloakAuthTestingGuard,
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
    const otherOrganizationId = randomUUID();
    const model = Model.create({
      name: "name",
      userId: authContext.keycloakUser.sub,
      organizationId: otherOrganizationId,
      template,
    });
    await modelsService.save(model);
    const item = Item.create({
      organizationId: otherOrganizationId,
      userId: authContext.keycloakUser.sub,
      template,
      model,
    });
    await itemsService.save(item);
    const item2 = Item.create({
      organizationId: otherOrganizationId,
      userId: authContext.keycloakUser.sub,
      model,
      template,
    });
    await itemsService.save(item2);
    const response = await request(getApp(app))
      .get(`/organizations/${otherOrganizationId}/models/${model.id}/items`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organization.id],
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/GET all item fails if model do not belong to organization`, async () => {
    const otherOrganizationId = randomUUID();
    const model = Model.create({
      name: "name",
      userId: authContext.keycloakUser.sub,
      organizationId: otherOrganizationId,
      template,
    });
    await modelsService.save(model);
    const item = Item.create({
      organizationId: otherOrganizationId,
      userId: authContext.keycloakUser.sub,
      template,
      model,
    });
    await itemsService.save(item);
    const item2 = Item.create({
      organizationId: otherOrganizationId,
      userId: authContext.keycloakUser.sub,
      template,
      model,
    });
    await itemsService.save(item2);
    const response = await request(getApp(app))
      .get(`/organizations/${organization.id}/models/${model.id}/items`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          authContext.keycloakUser.sub,
          [organization.id],
          keycloakAuthTestingGuard,
        ),
      );
    expect(response.status).toEqual(403);
  });

  afterAll(async () => {
    await app.close();
  });
});
