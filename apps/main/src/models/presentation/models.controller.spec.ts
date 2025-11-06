import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseExceptionFilter } from "@open-dpp/exception";
import { getApp, ignoreIds } from "@open-dpp/testing";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";
import { generateMongoConfig } from "../../database/config";
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
import { DataValue } from "../../product-passport-data/domain/data-value";
import { Template } from "../../templates/domain/template";
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
  let authService: AuthService;

  const sectionId3 = randomUUID();
  const dataFieldId4 = randomUUID();
  const dataFieldId5 = randomUUID();

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
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [ModelsController],
    })
      .overrideProvider(EmailService)
      .useValue({
        send: jest.fn(),
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

    authService = moduleRef.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new NotFoundInDatabaseExceptionFilter());
    await app.init();

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  it(`/CREATE model`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const body = {
      name: "My name",
      description: "My desc",
      templateId: template.id,
    };
    const response = await request(getApp(app))
      .post(`/organizations/${org.id}/models`)
      .set("Cookie", userCookie)
      .send(body);
    expect(response.status).toEqual(201);
    const found = await modelsService.findOneOrFail(response.body.id);
    expect(response.body.id).toEqual(found.id);
    expect(found.isOwnedBy(org.id)).toBeTruthy();
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
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const template = Template.loadFromDb(laptopModel);
    const { id: marketplaceResourceId } = await marketplaceService.upload(
      template,
      user,
      org.id,
      org.name,
    );

    const body = {
      name: "My name",
      description: "My desc",
      marketplaceResourceId,
    };
    const response = await request(getApp(app))
      .post(`/organizations/${org.id}/models`)
      .set("Cookie", userCookie)
      .send(body);
    expect(response.status).toEqual(201);
    const found = await modelsService.findOneOrFail(response.body.id);
    expect(response.body.id).toEqual(found.id);
    expect(found.isOwnedBy(org.id)).toBeTruthy();
    const foundTemplate = await templateService.findOneOrFail(found.templateId);
    expect(foundTemplate.marketplaceResourceId).toEqual(marketplaceResourceId);
  });

  it(`/CREATE model fails if user is not member of organization`, async () => {
    const { userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const body = {
      name: "My name",
      description: "My desc",
      templateId: randomUUID(),
    };
    const response = await request(getApp(app))
      .post(`/organizations/${org2.id}/models`)
      .set("Cookie", userCookie)
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/CREATE model fails if template does not belong to organization`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const template = Template.loadFromDb({
      ...laptopModel,
      organizationId: org2.id,
    });
    await templateService.save(template);
    const body = {
      name: "My name",
      description: "My desc",
      templateId: template.id,
    };
    const response = await request(getApp(app))
      .post(`/organizations/${org.id}/models`)
      .set("Cookie", userCookie)
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/CREATE model fails if template and marketplace resource id are provided`, async () => {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const body = {
      name: "My name",
      description: "My desc",
      templateId: randomUUID(),
      marketplaceResourceId: randomUUID(),
    };
    const response = await request(getApp(app))
      .post(`/organizations/${org.id}/models`)
      .set("Cookie", userCookie)
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
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const body = {
      name: "My name",
      description: "My desc",
    };
    const response = await request(getApp(app))
      .post(`/organizations/${org.id}/models`)
      .set("Cookie", userCookie)
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
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const modelNames = ["P1", "P2"];
    const template = Template.loadFromDb(laptopModel);

    const models: Model[] = await Promise.all(
      modelNames.map(async (pn) => {
        const model = Model.create({
          name: pn,
          organizationId: org.id,
          userId: user.id as string,
          template,
        });
        return await modelsService.save(model);
      }),
    );
    await modelsService.save(
      Model.create({
        name: "Other Orga",
        organizationId: org.id,
        userId: user.id,
        template,
      }),
    );

    const response = await request(getApp(app))
      .get(`/organizations/${org.id}/models`)
      .set("Cookie", userCookie);
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
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const template = Template.loadFromDb(laptopModel);

    const model = Model.create({
      name: "Model",
      organizationId: org2.id,
      userId: user.id,
      template,
    });
    await modelsService.save(model);

    const response = await request(getApp(app))
      .get(`/organizations/${org2.id}/models`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(403);
  });

  it(`/GET model`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const template = Template.loadFromDb(laptopModel);

    const model = Model.create({
      name: "Model",
      organizationId: org.id,
      userId: user.id,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .get(`/organizations/${org.id}/models/${model.id}`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(modelToDto(model));
  });

  it(`/GET model fails if user is not member of organization`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const template = Template.loadFromDb(laptopModel);

    const model = Model.create({
      name: "Model",
      organizationId: org2.id,
      userId: user.id,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .get(`/organizations/${org.id}/models/${model.id}`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(403);
  });

  it(`/GET model fails if model does not belong to organization`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const template = Template.loadFromDb(laptopModel);

    const model = Model.create({
      name: "Model",
      organizationId: org2.id,
      userId: user.id,
      template,
    });
    await modelsService.save(model);
    const response = await request(getApp(app))
      .get(`/organizations/${org.id}/models/${model.id}`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(403);
  });

  //
  it("update data values of model", async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      name: "My name",
      organizationId: org.id,
      userId: user.id,
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
      .patch(`/organizations/${org.id}/models/${model.id}/data-values`)
      .set("Cookie", userCookie)
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
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      name: "My name",
      organizationId: org2.id,
      userId: user.id,
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
        `/organizations/${org.id}/models/${model.id}/data-values`,
      )
      .set("Cookie", userCookie)
      .send(updatedValues);
    expect(response.status).toEqual(403);
  });

  it("update data values fails if model does not belong to organization", async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const otherOrganizationId = randomUUID();
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      name: "My name",
      organizationId: otherOrganizationId,
      userId: user.id,
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
      .patch(`/organizations/${org.id}/models/${model.id}/data-values`)
      .set("Cookie", userCookie)
      .send(updatedValues);
    expect(response.status).toEqual(403);
  });

  //
  it("update data values fails caused by validation", async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      name: "My name",
      organizationId: org.id,
      userId: user.id,
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
      .patch(`/organizations/${org.id}/models/${model.id}/data-values`)
      .set("Cookie", userCookie)
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

  // it("add media to model", async () => {
  //   const template = Template.loadFromDb(laptopModel);
  //   await templateService.save(template);
  //   const model = Model.create({
  //     name: "My name",
  //     organizationId: TestUsersAndOrganizations.organizations.org1.id,
  //     userId: TestUsersAndOrganizations.users.user1.id,
  //     template,
  //   });
  //   model.createUniqueProductIdentifier();
  //
  //   await modelsService.save(model);
  //   const mediaReference = { id: randomUUID() };
  //   const response = await request(getApp(app))
  //     .post(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/media`)
  //     .set(
  //       "Authorization",
  //       getKeycloakAuthToken(
  //         TestUsersAndOrganizations.users.user1.keycloakUserId,
  //         keycloakAuthTestingGuard,
  //       ),
  //     )
  //     .send(mediaReference);
  //   expect(response.status).toEqual(201);
  //   expect(response.body.mediaReferences).toEqual([mediaReference.id]);
  // });
  //
  // it("delete media from model", async () => {
  //   const template = Template.loadFromDb(laptopModel);
  //   await templateService.save(template);
  //   const model = Model.create({
  //     name: "My name",
  //     organizationId: TestUsersAndOrganizations.organizations.org1.id,
  //     userId: TestUsersAndOrganizations.users.user1.id,
  //     template,
  //   });
  //   const mediaReferenceToDelete = randomUUID();
  //   model.addMediaReference(mediaReferenceToDelete);
  //   const mediaReferenceToKeep = randomUUID();
  //   model.addMediaReference(mediaReferenceToKeep);
  //   model.createUniqueProductIdentifier();
  //
  //   await modelsService.save(model);
  //   const response = await request(getApp(app))
  //     .delete(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/media/${mediaReferenceToDelete}`)
  //     .set(
  //       "Authorization",
  //       getKeycloakAuthToken(
  //         TestUsersAndOrganizations.users.user1.keycloakUserId,
  //         keycloakAuthTestingGuard,
  //       ),
  //     );
  //   expect(response.status).toEqual(200);
  //   expect(response.body.mediaReferences).toEqual([mediaReferenceToKeep]);
  // });
  //
  // it("modify media of model", async () => {
  //   const template = Template.loadFromDb(laptopModel);
  //   await templateService.save(template);
  //   const model = Model.create({
  //     name: "My name",
  //     organizationId: TestUsersAndOrganizations.organizations.org1.id,
  //     userId: TestUsersAndOrganizations.users.user1.id,
  //     template,
  //   });
  //   const mediaReference1 = randomUUID();
  //   model.addMediaReference(mediaReference1);
  //   const mediaReference2 = randomUUID();
  //   model.addMediaReference(mediaReference2);
  //   model.createUniqueProductIdentifier();
  //
  //   await modelsService.save(model);
  //   const mediaReferencePayload = {
  //     id: randomUUID(),
  //   };
  //   const response = await request(getApp(app))
  //     .patch(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/media/${mediaReference1}`)
  //     .set(
  //       "Authorization",
  //       getKeycloakAuthToken(
  //         TestUsersAndOrganizations.users.user1.keycloakUserId,
  //         keycloakAuthTestingGuard,
  //       ),
  //     )
  //     .send(mediaReferencePayload);
  //   expect(response.status).toEqual(200);
  //   expect(response.body.mediaReferences).toEqual([mediaReferencePayload.id, mediaReference2]);
  // });
  //
  // it("move media to another position", async () => {
  //   const template = Template.loadFromDb(laptopModel);
  //   await templateService.save(template);
  //   const model = Model.create({
  //     name: "My name",
  //     organizationId: TestUsersAndOrganizations.organizations.org1.id,
  //     userId: TestUsersAndOrganizations.users.user1.id,
  //     template,
  //   });
  //   model.createUniqueProductIdentifier();
  //   const mediaReference1 = randomUUID();
  //   const mediaReference2 = randomUUID();
  //   const mediaReference3 = randomUUID();
  //   model.addMediaReference(mediaReference1);
  //   model.addMediaReference(mediaReference2);
  //   model.addMediaReference(mediaReference3);
  //
  //   await modelsService.save(model);
  //   const positionPayload = { position: 2 };
  //   const response = await request(getApp(app))
  //     .patch(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/models/${model.id}/media/${mediaReference1}/move`)
  //     .set(
  //       "Authorization",
  //       getKeycloakAuthToken(
  //         TestUsersAndOrganizations.users.user1.keycloakUserId,
  //         keycloakAuthTestingGuard,
  //       ),
  //     )
  //     .send(positionPayload);
  //   expect(response.status).toEqual(200);
  //   expect(response.body.mediaReferences).toEqual([mediaReference2, mediaReference3, mediaReference1]);
  // });

  //
  it("add data values to model", async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      name: "My name",
      organizationId: org.id,
      userId: user.id,
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
      .post(`/organizations/${org.id}/models/${model.id}/data-values`)
      .set("Cookie", userCookie)
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
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const laptopModel = laptopFactory
      .addSections()
      .build({ organizationId: org.id, userId: user.id });
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      name: "My name",
      organizationId: org2.id,
      userId: user.id,
      template,
    });

    await modelsService.save(model);
    const addedValues: Array<any> = [];
    const response = await request(getApp(app))
      .post(
        `/organizations/${org2.id}/models/${model.id}/data-values`,
      )
      .set("Cookie", userCookie)
      .send(addedValues);
    expect(response.status).toEqual(403);
  });

  afterAll(async () => {
    await app.close();
  });
});
