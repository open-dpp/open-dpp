import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import { NotFoundInDatabaseExceptionFilter } from "@open-dpp/exception";
import { getApp, ignoreIds, MongooseTestingModule } from "@open-dpp/testing";
import request from "supertest";
import { BetterAuthTestingGuard, getBetterAuthToken } from "../../../test/better-auth-testing.guard";
import TestUsersAndOrganizations from "../../../test/test-users-and-orgs";
import { AuthService } from "../../auth/auth.service";
import { EmailModule } from "../../email/email.module";
import { EmailService } from "../../email/email.service";
import { AasConnectionDoc, AasConnectionSchema } from "../../integrations/infrastructure/aas-connection.schema";
import { ItemDoc, ItemSchema } from "../../items/infrastructure/item.schema";
import { ItemsService } from "../../items/infrastructure/items.service";
import {
  PassportTemplatePublicationDbSchema,
  PassportTemplatePublicationDoc,
} from "../../marketplace/infrastructure/passport-template-publication.schema";
import {
  PassportTemplatePublicationService,
} from "../../marketplace/infrastructure/passport-template-publication.service";
import { MarketplaceApplicationService } from "../../marketplace/presentation/marketplace.application.service";
import { OrganizationDbSchema, OrganizationDoc } from "../../organizations/infrastructure/organization.schema";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import { DataValue } from "../../product-passport-data/domain/data-value";
import { Template, TemplateDbProps } from "../../templates/domain/template";
import {
  LaptopFactory,
  laptopFactory,
} from "../../templates/fixtures/laptop.factory";
import { TemplateDoc, TemplateSchema } from "../../templates/infrastructure/template.schema";
import { TemplateService } from "../../templates/infrastructure/template.service";
import {
  DppEventSchema,
  TraceabilityEventDocument,
} from "../../traceability-events/infrastructure/traceability-event.document";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { UsersService } from "../../users/infrastructure/users.service";
import { Model } from "../domain/model";
import { ModelDoc, ModelSchema } from "../infrastructure/model.schema";
import { ModelsService } from "../infrastructure/models.service";
import { modelToDto } from "./dto/model.dto";
import { ModelsController } from "./models.controller";

describe("modelsController", () => {
  let app: INestApplication;
  let uniqueProductIdentifierService: UniqueProductIdentifierService;
  let modelsService: ModelsService;
  let templateService: TemplateService;
  let marketplaceService: MarketplaceApplicationService;

  const betterAuthTestingGuard = new BetterAuthTestingGuard(new Reflector());
  betterAuthTestingGuard.loadUsers([TestUsersAndOrganizations.users.user1, TestUsersAndOrganizations.users.user2]);

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
        EmailModule,
      ],
      providers: [
        UsersService,
        OrganizationsService,
        ModelsService,
        ItemsService,
        UniqueProductIdentifierService,
        TemplateService,
        MarketplaceApplicationService,
        PassportTemplatePublicationService,
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
      controllers: [ModelsController],
    })
      .compile();

    uniqueProductIdentifierService = moduleRef.get(
      UniqueProductIdentifierService,
    );
    modelsService = moduleRef.get(ModelsService);
    templateService = moduleRef.get<TemplateService>(TemplateService);
    marketplaceService = moduleRef.get<MarketplaceApplicationService>(
      MarketplaceApplicationService,
    );
    const organizationService = moduleRef.get(OrganizationsService);

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new NotFoundInDatabaseExceptionFilter());

    await app.init();

    await organizationService.save(TestUsersAndOrganizations.organizations.org1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org2);
  });

  const sectionId3 = randomUUID();
  const dataFieldId4 = randomUUID();
  const dataFieldId5 = randomUUID();

  const laptopModel: TemplateDbProps = laptopFactory
    .addSections()
    .build({ organizationId: TestUsersAndOrganizations.organizations.org1.id, userId: TestUsersAndOrganizations.users.user1.id });

  it(`/CREATE model`, async () => {
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const body = {
      name: "My name",
      description: "My desc",
      templateId: template.id,
    };
    const response = await request(getApp(app))
      .post(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
      .send(body);
    expect(response.status).toEqual(201);
    const found = await modelsService.findOneOrFail(response.body.id);
    expect(response.body.id).toEqual(found.id);
    expect(found.isOwnedBy(TestUsersAndOrganizations.organizations.org1.id)).toBeTruthy();
    expect(found.templateId).toEqual(template.id);
    const foundUniqueProductIdentifiers
      = await uniqueProductIdentifierService.findAllByReferencedId(found.id);
    for (const uniqueProductIdentifier of foundUniqueProductIdentifiers) {
      expect(uniqueProductIdentifier.referenceId).toEqual(found.id);
    }
    expect(response.body.uniqueProductIdentifiers).toEqual(
      foundUniqueProductIdentifiers,
    );
  });

  it(`/CREATE model using template from marketplace`, async () => {
    const template = Template.loadFromDb(laptopModel);
    const token = getBetterAuthToken(
      TestUsersAndOrganizations.users.user1.id,
    );
    const { id: marketplaceResourceId } = await marketplaceService.upload(
      template,
      TestUsersAndOrganizations.users.user1,
    );

    const body = {
      name: "My name",
      description: "My desc",
      marketplaceResourceId,
    };
    const response = await request(getApp(app))
      .post(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models`)
      .set("Authorization", token)
      .send(body);
    expect(response.status).toEqual(201);
    const found = await modelsService.findOneOrFail(response.body.id);
    expect(response.body.id).toEqual(found.id);
    expect(found.isOwnedBy(TestUsersAndOrganizations.organizations.org1.id)).toBeTruthy();
    const foundTemplate = await templateService.findOneOrFail(found.templateId);
    expect(foundTemplate.marketplaceResourceId).toEqual(marketplaceResourceId);
  });

  it(`/CREATE model fails if user is not member of organization`, async () => {
    const body = {
      name: "My name",
      description: "My desc",
      templateId: randomUUID(),
    };
    const response = await request(getApp(app))
      .post(`/organizations/${TestUsersAndOrganizations.organizations.org2.id}/models`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/CREATE model fails if template does not belong to organization`, async () => {
    const template = Template.loadFromDb({
      ...laptopModel,
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
    });
    await templateService.save(template);
    const body = {
      name: "My name",
      description: "My desc",
      templateId: template.id,
    };
    const response = await request(getApp(app))
      .post(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/CREATE model fails if template and marketplace resource id are provided`, async () => {
    const body = {
      name: "My name",
      description: "My desc",
      templateId: randomUUID(),
      marketplaceResourceId: randomUUID(),
    };
    const response = await request(getApp(app))
      .post(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
      .send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors).toEqual([
      {
        code: "custom",
        message: "marketplaceResourceId and templateId are mutually exclusive",
        path: [],
      },
    ]);
  });

  it(`/CREATE model fails if neither template nor marketplace resource id are provided`, async () => {
    const body = {
      name: "My name",
      description: "My desc",
    };
    const response = await request(getApp(app))
      .post(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
      .send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors).toEqual([
      {
        code: "custom",
        message: "marketplaceResourceId or templateId must be provided",
        path: [],
      },
    ]);
  });

  it(`/GET models of organization`, async () => {
    const modelNames = ["P1", "P2"];
    const template = Template.loadFromDb(laptopModel);

    const models: Model[] = await Promise.all(
      modelNames.map(async (pn) => {
        const model = Model.create({
          name: pn,
          organizationId: TestUsersAndOrganizations.organizations.org1.id,
          userId: TestUsersAndOrganizations.users.user1.id,
          template,
        });
        return await modelsService.save(model);
      }),
    );
    await modelsService.save(
      Model.create({
        name: "Other Orga",
        organizationId: TestUsersAndOrganizations.organizations.org1.id,
        userId: TestUsersAndOrganizations.users.user1.id,
        template,
      }),
    );

    const response = await request(getApp(app))
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(200);

    expect(response.body).toEqual(
      expect.arrayContaining(
        models.map((m) => {
          const dto = modelToDto(m);
          // Only assert on stable fields you care about
          return expect.objectContaining({
            id: dto.id,
            name: dto.name,
            templateId: dto.templateId,
            owner: dto.owner,
            // You can also verify dataValues structure without insisting on `value`
            dataValues: expect.arrayContaining(
              dto.dataValues.map(dv => expect.objectContaining({
                dataFieldId: dv.dataFieldId,
                dataSectionId: dv.dataSectionId,
                row: dv.row,
              })),
            ),
          });
        }),
      ),
    );
  });

  it(`/GET models of organization fails if user is not part of organization`, async () => {
    const template = Template.loadFromDb(laptopModel);

    const model = Model.create({
      name: "Model",
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
    });
    await modelsService.save(model);

    const response = await request(getApp(app))
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org2.id}/models`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/GET model`, async () => {
    const template = Template.loadFromDb(laptopModel);

    const model = Model.create({
      name: "Model",
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(modelToDto(model));
  });

  it(`/GET model fails if user is not member of organization`, async () => {
    const template = Template.loadFromDb(laptopModel);

    const model = Model.create({
      name: "Model",
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/GET model fails if model does not belong to organization`, async () => {
    const template = Template.loadFromDb(laptopModel);

    const model = Model.create({
      name: "Model",
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(403);
  });

  //
  it("update data values of model", async () => {
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      name: "My name",
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
    });

    model.createUniqueProductIdentifier();
    await modelsService.save(model);
    const dataValue1 = model.dataValues[0];
    const dataValue2 = model.dataValues[1];
    const dataValue3 = model.dataValues[2];
    const updatedValues = [
      {
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        dataSectionId: LaptopFactory.ids.techSpecs.id,
        value: "AMD 8",
        row: 0,
      },
      {
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        dataSectionId: LaptopFactory.ids.environment.id,
        value: 888,
        row: 0,
      },
    ];
    const response = await request(getApp(app))
      .patch(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/data-values`)
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
        value: "AMD 8",
        row: 0,
      },
      {
        ...dataValue2,
        row: 0,
      },
      {
        ...dataValue3,
        value: 888,
        row: 0,
      },
    ];
    expect(response.body.dataValues).toEqual(expectedDataValues);
    const foundModel = await modelsService.findOneOrFail(response.body.id);
    expect(foundModel.dataValues).toEqual(expectedDataValues);
  });

  it("update data values fails if user is not member of organization", async () => {
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      name: "My name",
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
    });

    await modelsService.save(model);
    const dataValue1 = model.dataValues[0];
    const updatedValues = [
      {
        dataFieldId: dataValue1.dataFieldId,
        dataSectionId: dataValue1.dataSectionId,
        value: "value 1",
        row: 0,
      },
    ];
    const response = await request(getApp(app))
      .patch(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/data-values`,
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

  it("update data values fails if model does not belong to organization", async () => {
    const otherOrganizationId = randomUUID();
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      name: "My name",
      organizationId: otherOrganizationId,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
    });

    await modelsService.save(model);
    const dataValue1 = model.dataValues[0];
    const updatedValues = [
      {
        dataFieldId: dataValue1.dataFieldId,
        dataSectionId: dataValue1.dataSectionId,
        value: "value 1",
        row: 0,
      },
    ];
    const response = await request(getApp(app))
      .patch(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/data-values`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
      .send(updatedValues);
    expect(response.status).toEqual(403);
  });

  //
  it("update data values fails caused by validation", async () => {
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      name: "My name",
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
    });

    await modelsService.save(model);
    const updatedValues = [
      {
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        dataSectionId: LaptopFactory.ids.techSpecs.id,
        value: { wrongValue: "value 1" },
        row: 0,
      },
      {
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        dataSectionId: LaptopFactory.ids.environment.id,
        value: 888,
        row: 0,
      },
    ];
    const response = await request(getApp(app))
      .patch(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/data-values`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
      .send(updatedValues);
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      errors: [
        {
          id: LaptopFactory.ids.techSpecs.fields.processor,
          message: "Invalid input: expected string, received object",
          name: "Processor",
        },
      ],
      isValid: false,
    });
  });
  //
  it("add data values to model", async () => {
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      name: "My name",
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
    });
    model.createUniqueProductIdentifier();

    await modelsService.save(model);
    const existingDataValues = model.dataValues;
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
      .post(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/data-values`)
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

    const foundModel = await modelsService.findOneOrFail(response.body.id);

    expect(foundModel.dataValues).toEqual(response.body.dataValues);
  });

  it("add data values to model fails if user is not member of organization", async () => {
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      name: "My name",
      organizationId: TestUsersAndOrganizations.organizations.org2.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      template,
    });

    await modelsService.save(model);
    const addedValues: Array<any> = [];
    const response = await request(getApp(app))
      .post(
        `/organizations/${TestUsersAndOrganizations.organizations.org2.id}/models/${model.id}/data-values`,
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

  afterAll(async () => {
    await app.close();
  });
});
