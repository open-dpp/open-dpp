import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { json } from "express";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import {
  getApp,
} from "../../../test/utils.for.test";
import { AuthGuard } from "../../identity/auth/auth.guard";
import { AuthModule } from "../../identity/auth/auth.module";
import { AuthService } from "../../identity/auth/auth.service";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { ItemDoc, ItemSchema } from "../../items/infrastructure/item.schema";
import { ItemsService } from "../../items/infrastructure/items.service";
import { ItemsApplicationService } from "../../items/presentation/items-application.service";
import { Model } from "../../models/domain/model";
import { ModelDoc, ModelSchema } from "../../models/infrastructure/model.schema";
import { ModelsService } from "../../models/infrastructure/models.service";
import { Template, TemplateDbProps } from "../../old-templates/domain/template";
import { dataFieldDbPropsFactory } from "../../old-templates/fixtures/data-field.factory";
import { laptopFactory } from "../../old-templates/fixtures/laptop.factory";
import { sectionDbPropsFactory } from "../../old-templates/fixtures/section.factory";
import { OldTemplateDoc, TemplateSchema } from "../../old-templates/infrastructure/template.schema";
import { TemplateService } from "../../old-templates/infrastructure/template.service";
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
import { AasConnection, AasFieldAssignment } from "../domain/aas-connection";
import { AssetAdministrationShellType } from "../domain/asset-administration-shell";
import { semitrailerTruckAas } from "../domain/semitrailer-truck-aas";
import { AasConnectionDoc, AasConnectionSchema } from "../infrastructure/aas-connection.schema";
import { AasConnectionService } from "../infrastructure/aas-connection.service";
import { AasConnectionController } from "./aas-connection.controller";

describe("aasConnectionController", () => {
  let app: INestApplication;
  let templateService: TemplateService;
  let aasConnectionService: AasConnectionService;
  let modelsService: ModelsService;
  let itemsService: ItemsService;
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
            name: OldTemplateDoc.name,
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
        ]),
        AuthModule,
      ],
      providers: [
        TemplateService,
        AasConnectionService,
        ModelsService,
        ItemsService,
        UniqueProductIdentifierService,
        ItemsApplicationService,
        TraceabilityEventsService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [AasConnectionController],
    })
      .overrideProvider(EmailService)
      .useValue({
        send: jest.fn(),
      })
      .compile();

    app = moduleRef.createNestApplication();

    app.use(
      "/organizations/:organizationId/integration/aas/:aasMappingId",
      json({ limit: "50mb" }),
    );

    templateService = moduleRef.get(TemplateService);
    aasConnectionService = moduleRef.get(AasConnectionService);
    modelsService = moduleRef.get(ModelsService);
    itemsService = moduleRef.get(ItemsService);

    uniqueProductIdentifierService = moduleRef.get(
      UniqueProductIdentifierService,
    );
    authService = moduleRef.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    await app.init();

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  const sectionId1 = randomUUID();
  const dataFieldId1 = randomUUID();

  it(`/CREATE items via connection`, async () => {
    const { org, user } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const apiKeyUser = await betterAuthHelper.createApiKey(user.id as string);
    const laptopModel: TemplateDbProps = laptopFactory.build({
      organizationId: org.id,
      userId: user.id,
      sections: [
        sectionDbPropsFactory.build({
          id: sectionId1,
          name: "Carbon Footprint",
          dataFields: [
            dataFieldDbPropsFactory.build({
              id: dataFieldId1,
              name: "PCFCalculationMethod",
              granularityLevel: GranularityLevel.ITEM,
            }),
          ],
        }),
      ],
    });
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      organizationId: org.id,
      userId: user.id,
      name: "Laptop",
      template,
    });
    const aasMapping = AasConnection.create({
      name: "Connection Name",
      organizationId: org.id,
      userId: user.id,
      dataModelId: template.id,
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
      modelId: model.id,
    });
    const fieldMapping = AasFieldAssignment.create({
      sectionId: sectionId1,
      dataFieldId: dataFieldId1,
      idShortParent: "ProductCarbonFootprint_A1A3",
      idShort: "PCFCO2eq",
    });
    aasMapping.addFieldAssignment(fieldMapping);
    await modelsService.save(model);
    await aasConnectionService.save(aasMapping);

    const globalAssetId = `Semitrailer_Truck_-10204004-0010-02_${randomUUID()}`;
    const response = await request(getApp(app))
      .post(
        `/organizations/${org.id}/integration/aas/connections/${aasMapping.id}/items`,
      )
      .set("X-API-KEY", apiKeyUser)
      .send({
        ...semitrailerTruckAas,
        assetAdministrationShells: [
          {
            ...semitrailerTruckAas.assetAdministrationShells[0],
            assetInformation: {
              assetKind: "Instance",
              assetType: "product",
              globalAssetId,
            },
          },
        ],
      });
    expect(response.status).toEqual(201);
    expect(response.body.dataValues).toEqual([
      {
        dataSectionId: sectionId1,
        dataFieldId: dataFieldId1,
        value: "2.6300",
        row: 0,
      },
    ]);
    const foundUniqueProductIdentifier
      = await uniqueProductIdentifierService.findOneOrFail(globalAssetId);
    const item = await itemsService.findOneOrFail(
      foundUniqueProductIdentifier.referenceId,
    );
    expect(item.modelId).toEqual(model.id);
    expect(item.templateId).toEqual(template.id);
  });

  it(`/CREATE connection`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const laptopModel: TemplateDbProps = laptopFactory.build({
      organizationId: org.id,
      userId: user.id,
      sections: [
        sectionDbPropsFactory.build({
          id: sectionId1,
          name: "Carbon Footprint",
          dataFields: [
            dataFieldDbPropsFactory.build({
              id: dataFieldId1,
              name: "PCFCalculationMethod",
              granularityLevel: GranularityLevel.ITEM,
            }),
          ],
        }),
      ],
    });
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      organizationId: org.id,
      userId: user.id,
      name: "Laptop",
      template,
    });
    await modelsService.save(model);

    const body = {
      name: "Connection Name",
      dataModelId: template.id,
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
      modelId: model.id,
      fieldAssignments: [
        {
          sectionId: sectionId1,
          dataFieldId: dataFieldId1,
          idShortParent: "ProductCarbonFootprint_A1A3",
          idShort: "PCFCO2eq",
        },
      ],
    };

    const response = await request(getApp(app))
      .post(`/organizations/${org.id}/integration/aas/connections`)
      .set("Cookie", userCookie)
      .send(body);
    expect(response.status).toEqual(201);
    expect(response.body.dataModelId).toEqual(template.id);
    expect(response.body.aasType).toEqual(
      AssetAdministrationShellType.Semitrailer_Truck,
    );
    expect(response.body.name).toEqual("Connection Name");
    expect(response.body.modelId).toEqual(model.id);
    expect(response.body.fieldAssignments).toEqual(body.fieldAssignments);
  });

  it(`/UPDATE connection`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const laptopModel: TemplateDbProps = laptopFactory.build({
      organizationId: org.id,
      userId: user.id,
      sections: [
        sectionDbPropsFactory.build({
          id: sectionId1,
          name: "Carbon Footprint",
          dataFields: [
            dataFieldDbPropsFactory.build({
              id: dataFieldId1,
              name: "PCFCalculationMethod",
              granularityLevel: GranularityLevel.ITEM,
            }),
          ],
        }),
      ],
    });
    const aasConnection = AasConnection.create({
      name: "Connection Name",
      organizationId: org.id,
      userId: user.id,
      dataModelId: randomUUID(),
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
      modelId: randomUUID(),
    });
    await aasConnectionService.save(aasConnection);

    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      organizationId: org.id,
      userId: user.id,
      name: "Laptop",
      template,
    });
    await modelsService.save(model);

    const body = {
      name: "Other Name",
      modelId: model.id,
      fieldAssignments: [
        {
          sectionId: sectionId1,
          dataFieldId: dataFieldId1,
          idShortParent: "ProductCarbonFootprint_A1A3",
          idShort: "PCFCO2eq",
        },
      ],
    };

    const response = await request(getApp(app))
      .patch(
        `/organizations/${org.id}/integration/aas/connections/${aasConnection.id}`,
      )
      .set("Cookie", userCookie)
      .send(body);
    expect(response.status).toEqual(200);
    expect(response.body.name).toEqual("Other Name");
    expect(response.body.modelId).toEqual(model.id);
    expect(response.body.dataModelId).toEqual(template.id);
    expect(response.body.fieldAssignments).toEqual(body.fieldAssignments);
  });

  it(`/GET all properties of aas`, async () => {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const response = await request(getApp(app))
      .get(
        `/organizations/${org.id}/integration/aas/${AssetAdministrationShellType.Semitrailer_Truck}/properties`,
      )
      .set("Cookie", userCookie);
    expect(response.status).toEqual(200);
    expect(response.body).toContainEqual({
      parentIdShort: "Nameplate",
      property: {
        idShort: "URIOfTheProduct",
        modelType: "Property",
        value: "0112/2///61987#TR590#900",
        valueType: "xs:string",
      },
    });
    expect(response.body).toContainEqual({
      parentIdShort: "AddressInformation",
      property: {
        idShort: "Company",
        modelType: "Property",
        value: "Proalpha GmbH",
        valueType: "xs:string",
      },
    });
  });

  it(`/GET all connections of organization`, async () => {
    const { org, user, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const aasConnection1 = AasConnection.create({
      name: "Connection Name 1",
      organizationId: org.id,
      userId: user.id,
      dataModelId: randomUUID(),
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
      modelId: randomUUID(),
    });
    const aasConnection2 = AasConnection.create({
      name: "Connection Name 2",
      organizationId: org.id,
      userId: user.id,
      dataModelId: randomUUID(),
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
      modelId: randomUUID(),
    });
    await aasConnectionService.save(aasConnection1);
    await aasConnectionService.save(aasConnection2);

    const response = await request(getApp(app))
      .get(`/organizations/${org.id}/integration/aas/connections`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual([
      {
        id: aasConnection1.id,
        name: "Connection Name 1",
      },
      {
        id: aasConnection2.id,
        name: "Connection Name 2",
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });
});
