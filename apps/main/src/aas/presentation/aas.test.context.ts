import type { INestApplication } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { ModuleMetadata } from "@nestjs/common/interfaces/modules/module-metadata.interface";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ModelDefinition } from "@nestjs/mongoose/dist/interfaces";
import { Test } from "@nestjs/testing";
import { SubmodelElementSchema, SubmodelJsonSchema } from "@open-dpp/aas";
import { EnvModule, EnvService } from "@open-dpp/env";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";

import { AasModule } from "../aas.module";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { IPersistable } from "../domain/persistable";
import { Submodel } from "../domain/submodel-base/submodel";
import { IdShortPath } from "../domain/submodel-base/submodel-base";

import { aasPlainFactory } from "../fixtures/aas.factory";
import { propertyPlainFactory } from "../fixtures/submodel-element.factory";
import {
  submodelBillOfMaterialPlainFactory,
  submodelCarbonFootprintPlainFactory,
  submodelDesignOfProductPlainFactory,
} from "../fixtures/submodel.factory";
import { AasRepository } from "../infrastructure/aas.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "../infrastructure/schemas/submodel.schema";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import { AssetAdministrationShellPaginationResponseDtoSchema } from "./dto/asset-administration-shell.dto";
import { SubmodelPaginationResponseDtoSchema } from "./dto/submodel.dto";

export function createAasTestContext<T>(basePath: string, metadataTestingModule: ModuleMetadata, mongooseModels: ModelDefinition[], EntityRepositoryClass: new (...args: any[]) => T) {
  let app: INestApplication;
  let authService: AuthService;
  let dppIdentifiableRepository: T;
  let submodelRepository: SubmodelRepository;
  let aasRepository: AasRepository;

  const betterAuthHelper = new BetterAuthHelper();
  let aas: AssetAdministrationShell;
  let submodels: Submodel[];

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
          { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
          { name: SubmodelDoc.name, schema: SubmodelSchema },
          ...mongooseModels,
        ]),
        AasModule,
        AuthModule,
        ...(metadataTestingModule.imports || []),
      ],
      providers: [
        AasRepository,
        SubmodelRepository,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
        ...(metadataTestingModule.providers || []),
      ],
      controllers: [...(metadataTestingModule.controllers || [])],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    authService = moduleRef.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    app = moduleRef.createNestApplication();
    await app.init();
    dppIdentifiableRepository = moduleRef.get<T>(EntityRepositoryClass);
    aasRepository = moduleRef.get<AasRepository>(AasRepository);
    submodelRepository = moduleRef.get<SubmodelRepository>(SubmodelRepository);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    aas = AssetAdministrationShell.fromPlain(aasPlainFactory.build(undefined, { transient: { iriDomain } }));
    submodels = [
      Submodel.fromPlain(submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } })),
      Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } })),
    ];
    await aasRepository.save(aas);
    for (const s of submodels) {
      await submodelRepository.save(s);
    }

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  type CreateEntity = (orgaId: string) => Promise<IPersistable>;

  async function assertGetShells(createEntity: CreateEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const passport = await createEntity(org.id);
    const response = await request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/shells?limit=1`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.paging_metadata.cursor).toEqual(aas.id);
    expect(response.body.result).toEqual(AssetAdministrationShellPaginationResponseDtoSchema.shape.result.parse([aas.toPlain()]));
  }

  async function assertGetSubmodels(createEntity: CreateEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const passport = await createEntity(org.id);
    const response = await request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/submodels?limit=2`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.paging_metadata.cursor).toEqual(submodels[1].id);
    expect(response.body.result).toEqual(SubmodelPaginationResponseDtoSchema.shape.result.parse(submodels.map(s => s.toPlain())));
  }

  async function assertGetSubmodelById(createEntity: CreateEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const passport = await createEntity(org.id);
    const response = await request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/submodels/${btoa(submodels[1].id)}`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(SubmodelJsonSchema.parse(submodels[1].toPlain()));
  }

  async function assertPostSubmodel(createEntity: CreateEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const passport = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    const submodelJson = submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } });

    const response = await request(app.getHttpServer())
      .post(`${basePath}/${passport.id}/submodels`)
      .set("Cookie", userCookie)
      .send(submodelJson);
    expect(response.status).toEqual(201);
    const foundSubmodel = await submodelRepository.findOneOrFail(response.body.id);
    expect(response.body).toEqual(SubmodelJsonSchema.parse(foundSubmodel.toPlain()));
  }

  async function assertGetSubmodelElements(createEntity: CreateEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const response = await request(app.getHttpServer())
      .get(`${basePath}/${entity.id}/submodels/${btoa(submodels[1].id)}/submodel-elements`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.paging_metadata.cursor).toEqual(submodels[1].submodelElements[submodels[1].submodelElements.length - 1].idShort);
    expect(response.body.result).toEqual(SubmodelElementSchema.array().parse(submodels[1].submodelElements.map(s => s.toPlain())));
  }

  async function assertPostSubmodelElement(createEntity: CreateEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const submodelElementJson = propertyPlainFactory.build();

    const response = await request(app.getHttpServer())
      .post(`${basePath}/${entity.id}/submodels/${btoa(submodels[1].id)}/submodel-elements`)
      .set("Cookie", userCookie)
      .send(submodelElementJson);
    expect(response.status).toEqual(201);
    const foundSubmodelElement = await submodelRepository.findOneOrFail(submodels[1].id);
    expect(response.body).toEqual(SubmodelElementSchema.parse(foundSubmodelElement.findSubmodelElementOrFail(
      IdShortPath.create({ path: submodelElementJson.idShort }),
    ).toPlain()));
  }

  async function assertGetSubmodelElementById(createEntity: CreateEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const response = await request(app.getHttpServer())
      .get(`${basePath}/${entity.id}/submodels/${btoa(submodels[0].id)}/submodel-elements/Design_V01.Author.AuthorName`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      modelType: "Property",
      category: null,
      description: [],
      displayName: [],
      embeddedDataSpecifications: [],
      extensions: [],
      supplementalSemanticIds: [],
      qualifiers: [],
      semanticId: {
        keys: [
          {
            type: "GlobalReference",
            value: "AuthorName",
          },
        ],
        type: "ExternalReference",
      },
      value: "Fabrikvordenker:in ER28-0652",
      valueType: "String",
      idShort: "AuthorName",
    });
  }

  async function assertPostSubmodelElementAtIdShortPath(createEntity: CreateEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const submodelElementJson = propertyPlainFactory.build();

    const response = await request(app.getHttpServer())
      .post(`${basePath}/${entity.id}/submodels/${btoa(submodels[0].id)}/submodel-elements/Design_V01.Author`)
      .set("Cookie", userCookie)
      .send(submodelElementJson);
    expect(response.status).toEqual(201);
    const foundSubmodelElement = await submodelRepository.findOneOrFail(submodels[0].id);
    expect(response.body).toEqual(SubmodelElementSchema.parse(foundSubmodelElement.findSubmodelElementOrFail(
      IdShortPath.create({ path: `Design_V01.Author.${submodelElementJson.idShort}` }),
    ).toPlain()));
  }

  async function assertGetSubmodelValue(createEntity: CreateEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const response = await request(app.getHttpServer())
      .get(`${basePath}/${entity.id}/submodels/${btoa(submodels[1].id)}/$value`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(
      {
        ProductCarbonFootprint_A1A3: {
          PCFCO2eq: "2.6300",
          PCFCalculationMethod: "GHG Protocol",
          PCFFactSheet: {
            type: "ExternalReference",
            keys: [
              {
                type: "GlobalReference",
                value: "http://pdf.shells.smartfactory.de/PCF_FactSheet/Truck_printed.pdf",
              },
            ],
          },
          PCFGoodsAddressHandover: {
            CityTown: "Kaiserslautern",
            Country: "Germany",
            HouseNumber: "122",
            Latitude: "49.428006",
            Longitude: "7.751222",
            Street: "Trippstadter Strasse",
            ZipCode: "67663",
          },
          PCFLifeCyclePhase: "A1-A3",
          PCFQuantityOfMeasureForCalculation: "1",
          PCFReferenceValueForCalculation: "piece",
          PublicationDate: "2025-03-31",
        },
        ProductCarbonFootprint_A4: {
          PCFCO2eq: "2.0000",
          PCFCalculationMethod: "GHG Protocol",
          PCFGoodsAddressHandover: {
            CityTown: "Hannover",
            Country: "Germany",
            HouseNumber: "11",
            Latitude: "52.31947731917296",
            Longitude: "9.81000507976999",
            Street: "Alte Kronsbergstraße",
            ZipCode: "30521",
          },
          PCFLifeCyclePhase: "A4",
          PCFQuantityOfMeasureForCalculation: "1",
          PCFReferenceValueForCalculation: "piece",
          PublicationDate: "2025-03-31",
        },
        ProductCarbonFootprint_B5: {
          PCFCO2eq: "4.0000",
          PCFCalculationMethod: "GHG Protocol",
          PCFGoodsAddressHandover: {
            CityTown: "Hannover",
            Country: "Germany",
            HouseNumber: "11",
            Latitude: "52.31947731917296",
            Longitude: "9.81000507976999",
            Street: "Alte Kronsbergstraße",
            ZipCode: "30521",
          },
          PCFLifeCyclePhase: "B5",
          PCFQuantityOfMeasureForCalculation: "1",
          PCFReferenceValueForCalculation: "piece",
          PublicationDate: "2025-03-31",
        },
      },
    );
  }

  async function assertGetSubmodelElementValue(createEntity: CreateEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const response = await request(app.getHttpServer())
      .get(`${basePath}/${entity.id}/submodels/${btoa(submodels[1].id)}/submodel-elements/ProductCarbonFootprint_A1A3/$value`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(
      {

        PCFCO2eq: "2.6300",
        PCFCalculationMethod: "GHG Protocol",
        PCFFactSheet: {
          type: "ExternalReference",
          keys: [
            {
              type: "GlobalReference",
              value: "http://pdf.shells.smartfactory.de/PCF_FactSheet/Truck_printed.pdf",
            },
          ],
        },
        PCFGoodsAddressHandover: {
          CityTown: "Kaiserslautern",
          Country: "Germany",
          HouseNumber: "122",
          Latitude: "49.428006",
          Longitude: "7.751222",
          Street: "Trippstadter Strasse",
          ZipCode: "67663",
        },
        PCFLifeCyclePhase: "A1-A3",
        PCFQuantityOfMeasureForCalculation: "1",
        PCFReferenceValueForCalculation: "piece",
        PublicationDate: "2025-03-31",
      },
    );
  }

  afterAll(async () => {
    await app.close();
  });

  return {
    globals: () => ({
      app,
      betterAuthHelper,
    }),
    getRepositories: () => ({ dppIdentifiableRepository, aasRepository }),
    getAasObjects: () => ({ aas, submodels }),
    asserts: {
      getShells: assertGetShells,
      getSubmodels: assertGetSubmodels,
      getSubmodelById: assertGetSubmodelById,
      postSubmodel: assertPostSubmodel,
      getSubmodelValue: assertGetSubmodelValue,
      getSubmodelElements: assertGetSubmodelElements,
      postSubmodelElement: assertPostSubmodelElement,
      postSubmodelElementAtIdShortPath: assertPostSubmodelElementAtIdShortPath,
      getSubmodelElementById: assertGetSubmodelElementById,
      getSubmodelElementValue: assertGetSubmodelElementValue,
    },
  };
}
