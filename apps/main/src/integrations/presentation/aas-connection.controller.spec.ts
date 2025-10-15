import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import getKeycloakAuthToken, {
  createKeycloakUserInToken,
  getApp,
  KeycloakAuthTestingGuard,
  KeycloakResourcesServiceTesting,
  MongooseTestingModule,
} from "@open-dpp/testing";
import { json } from "express";
import request from "supertest";
import TestUsersAndOrganizations from "../../../test/test-users-and-orgs";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { ItemDoc, ItemSchema } from "../../items/infrastructure/item.schema";
import { ItemsService } from "../../items/infrastructure/items.service";
import { ItemsApplicationService } from "../../items/presentation/items-application.service";
import { KeycloakResourcesService } from "../../keycloak-resources/infrastructure/keycloak-resources.service";
import { Model } from "../../models/domain/model";
import { ModelDoc, ModelSchema } from "../../models/infrastructure/model.schema";
import { ModelsService } from "../../models/infrastructure/models.service";
import { Organization } from "../../organizations/domain/organization";
import { OrganizationDbSchema, OrganizationDoc } from "../../organizations/infrastructure/organization.schema";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import { Template, TemplateDbProps } from "../../templates/domain/template";
import { dataFieldDbPropsFactory } from "../../templates/fixtures/data-field.factory";
import { laptopFactory } from "../../templates/fixtures/laptop.factory";
import { sectionDbPropsFactory } from "../../templates/fixtures/section.factory";
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
import { InjectUserToAuthContextGuard } from "../../users/infrastructure/inject-user-to-auth-context.guard";
import { UserDbSchema, UserDoc } from "../../users/infrastructure/user.schema";
import { UsersService } from "../../users/infrastructure/users.service";
import { AasConnection, AasFieldAssignment } from "../domain/aas-connection";
import { AssetAdministrationShellType } from "../domain/asset-administration-shell";
import { semitrailerTruckAas } from "../domain/semitrailer-truck-aas";
import { AasConnectionDoc, AasConnectionSchema } from "../infrastructure/aas-connection.schema";
import { AasConnectionService } from "../infrastructure/aas-connection.service";
import { AasConnectionController } from "./aas-connection.controller";

describe("aasConnectionController", () => {
  let app: INestApplication;
  const reflector: Reflector = new Reflector();
  const keycloakAuthTestingGuard = new KeycloakAuthTestingGuard(
    new Map(),
    reflector,
  );
  let templateService: TemplateService;
  let aasConnectionService: AasConnectionService;
  let modelsService: ModelsService;
  let itemsSevice: ItemsService;
  let uniqueProductIdentifierService: UniqueProductIdentifierService;
  let configService: EnvService;
  let organizationService: OrganizationsService;
  let usersService: UsersService;

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
            name: OrganizationDoc.name,
            schema: OrganizationDbSchema,
          },
          {
            name: UserDoc.name,
            schema: UserDbSchema,
          },
        ]),
      ],
      providers: [
        OrganizationsService,
        UsersService,
        TemplateService,
        AasConnectionService,
        ModelsService,
        ItemsService,
        UniqueProductIdentifierService,
        ItemsApplicationService,
        TraceabilityEventsService,
        {
          provide: APP_GUARD,
          useValue: keycloakAuthTestingGuard,
        },
        {
          provide: APP_GUARD,
          useClass: InjectUserToAuthContextGuard,
        },
      ],
      controllers: [AasConnectionController],
    })
      .overrideProvider(KeycloakResourcesService)
      .useValue(
        KeycloakResourcesServiceTesting.fromPlain({
          users: [
            {
              id: TestUsersAndOrganizations.keycloakUsers.keycloakUser1.sub,
              email: TestUsersAndOrganizations.keycloakUsers.keycloakUser1.email,
            },
          ],
        }),
      )
      .compile();

    app = moduleRef.createNestApplication();

    app.use(
      "/organizations/:organizationId/integration/aas/:aasMappingId",
      json({ limit: "50mb" }),
    );

    templateService = moduleRef.get(TemplateService);
    aasConnectionService = moduleRef.get(AasConnectionService);
    modelsService = moduleRef.get(ModelsService);
    itemsSevice = moduleRef.get(ItemsService);
    organizationService = moduleRef.get(OrganizationsService);
    usersService = moduleRef.get(UsersService);

    uniqueProductIdentifierService = moduleRef.get(
      UniqueProductIdentifierService,
    );
    configService = moduleRef.get(EnvService);

    await app.init();

    await usersService.save(TestUsersAndOrganizations.users.user1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org2);
  });
  beforeEach(() => {
    jest.spyOn(reflector, "get").mockReturnValue(false);
  });

  const sectionId1 = randomUUID();
  const dataFieldId1 = randomUUID();

  const laptopModel: TemplateDbProps = laptopFactory.build({
    organizationId: TestUsersAndOrganizations.organizations.org1.id,
    userId: TestUsersAndOrganizations.users.user1.id,
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

  it(`/CREATE items via connection`, async () => {
    jest.spyOn(reflector, "get").mockReturnValue(true);
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      name: "Laptop",
      template,
    });
    const aasMapping = AasConnection.create({
      name: "Connection Name",
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
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
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/integration/aas/connections/${aasMapping.id}/items`,
      )
      .set("API_TOKEN", configService.get("OPEN_DPP_AAS_TOKEN")!)
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
    const item = await itemsSevice.findOneOrFail(
      foundUniqueProductIdentifier.referenceId,
    );
    expect(item.modelId).toEqual(model.id);
    expect(item.templateId).toEqual(template.id);
  });

  it(`/CREATE connection`, async () => {
    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
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
      .post(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/integration/aas/connections`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
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
    const aasConnection = AasConnection.create({
      name: "Connection Name",
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
      dataModelId: randomUUID(),
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
      modelId: randomUUID(),
    });
    await aasConnectionService.save(aasConnection);

    const template = Template.loadFromDb(laptopModel);
    await templateService.save(template);
    const model = Model.create({
      organizationId: TestUsersAndOrganizations.organizations.org1.id,
      userId: TestUsersAndOrganizations.users.user1.id,
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
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/integration/aas/connections/${aasConnection.id}`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(body);
    expect(response.status).toEqual(200);
    expect(response.body.name).toEqual("Other Name");
    expect(response.body.modelId).toEqual(model.id);
    expect(response.body.dataModelId).toEqual(template.id);
    expect(response.body.fieldAssignments).toEqual(body.fieldAssignments);
  });

  it(`/GET all properties of aas`, async () => {
    jest.spyOn(reflector, "get").mockReturnValue(false);

    const response = await request(getApp(app))
      .get(
        `/organizations/${TestUsersAndOrganizations.organizations.org1.id}/integration/aas/${AssetAdministrationShellType.Semitrailer_Truck}/properties`,
      )
      .set(
        "Authorization",
        getKeycloakAuthToken(
          TestUsersAndOrganizations.users.user1.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      )
      .send(semitrailerTruckAas);
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
    const keycloakUserTemp = createKeycloakUserInToken();
    const userTemp = User.create({
      email: keycloakUserTemp.email,
      keycloakUserId: keycloakUserTemp.sub,
    });
    const orgTemp = Organization.create({
      name: "organization-temp-test",
      ownedByUserId: userTemp.id,
      createdByUserId: userTemp.id,
      members: [userTemp],
    });
    await usersService.save(userTemp);
    await organizationService.save(orgTemp);
    const aasConnection1 = AasConnection.create({
      name: "Connection Name 1",
      organizationId: orgTemp.id,
      userId: userTemp.keycloakUserId,
      dataModelId: randomUUID(),
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
      modelId: randomUUID(),
    });
    const aasConnection2 = AasConnection.create({
      name: "Connection Name 2",
      organizationId: orgTemp.id,
      userId: userTemp.keycloakUserId,
      dataModelId: randomUUID(),
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
      modelId: randomUUID(),
    });
    await aasConnectionService.save(aasConnection1);
    await aasConnectionService.save(aasConnection2);

    const response = await request(getApp(app))
      .get(`/organizations/${orgTemp.id}/integration/aas/connections`)
      .set(
        "Authorization",
        getKeycloakAuthToken(
          userTemp.keycloakUserId,
          keycloakAuthTestingGuard,
        ),
      );
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
