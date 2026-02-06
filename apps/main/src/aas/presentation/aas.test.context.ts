import type { INestApplication } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { ModuleMetadata } from "@nestjs/common/interfaces/modules/module-metadata.interface";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ModelDefinition } from "@nestjs/mongoose/dist/interfaces";
import { Test, TestingModule } from "@nestjs/testing";
import {
  AasSubmodelElements,
  AssetAdministrationShellPaginationResponseDtoSchema,
  KeyTypes,
  ReferenceTypes,
  SubmodelElementSchema,
  SubmodelJsonSchema,
  SubmodelPaginationResponseDtoSchema,
} from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import {
  aasPlainFactory,
  propertyPlainFactory,
  submodelBillOfMaterialPlainFactory,
  submodelCarbonFootprintPlainFactory,
  submodelDesignOfProductPlainFactory,
} from "@open-dpp/testing";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";
import { generateMongoConfig } from "../../database/config";

import { EmailService } from "../../email/email.service";
import { AasModule } from "../aas.module";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";

import { Key } from "../domain/common/key";
import { Reference } from "../domain/common/reference";
import { IDigitalProductPassportIdentifiable } from "../domain/digital-product-passport-identifiable";
import { IPersistable } from "../domain/persistable";

import { Property } from "../domain/submodel-base/property";
import { Submodel } from "../domain/submodel-base/submodel";
import { IdShortPath } from "../domain/submodel-base/submodel-base";
import { SubmodelElementCollection } from "../domain/submodel-base/submodel-element-collection";
import { SubmodelElementList } from "../domain/submodel-base/submodel-element-list";
import { TableExtension } from "../domain/submodel-base/table-extension";
import { AasRepository } from "../infrastructure/aas.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "../infrastructure/schemas/submodel.schema";
import { SubmodelRepository } from "../infrastructure/submodel.repository";

export function createAasTestContext<T>(basePath: string, metadataTestingModule: ModuleMetadata, mongooseModels: ModelDefinition[], EntityRepositoryClass: new (...args: any[]) => T) {
  let app: INestApplication;
  let authService: AuthService;
  let dppIdentifiableRepository: T;
  let submodelRepository: SubmodelRepository;
  let aasRepository: AasRepository;
  let moduleRef: TestingModule;

  const betterAuthHelper = new BetterAuthHelper();
  let aas: AssetAdministrationShell;
  let submodels: Submodel[];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
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

  type CreateEntity = (orgaId: string) => Promise<IPersistable & IDigitalProductPassportIdentifiable>;
  type SaveEntity = (entity: any) => Promise<IPersistable & IDigitalProductPassportIdentifiable>;

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

  async function assertModifySubmodel(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }));
    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const modificationBody = {
      idShort: submodel.idShort,
      displayName: [{ language: "en", text: "Bill of Materials" }],
      description: [{ language: "en", text: "A list of all products in the factory" }],
    };

    const response = await request(app.getHttpServer())
      .patch(`${basePath}/${entity.id}/submodels/${btoa(submodel.id)}`)
      .set("Cookie", userCookie)
      .send(modificationBody);
    expect(response.status).toEqual(200);
    expect({ idShort: response.body.idShort, displayName: response.body.displayName, description: response.body.description }).toEqual(modificationBody);
  }

  async function assertModifySubmodelElement(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }));
    const property = Property.fromPlain(propertyPlainFactory.build({ idShort: "Property01" }));
    submodel.addSubmodelElement(property);
    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const modificationBody = {
      idShort: property.idShort,
      displayName: [{ language: "en", text: "Bill of Materials" }],
      description: [{ language: "en", text: "A list of all products in the factory" }],
    };

    const response = await request(app.getHttpServer())
      .patch(`${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/Property01`)
      .set("Cookie", userCookie)
      .send(modificationBody);
    expect(response.status).toEqual(200);
    expect({ idShort: response.body.idShort, displayName: response.body.displayName, description: response.body.description }).toEqual(modificationBody);
  }

  async function assertModifySubmodelElementValue(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }));
    const property = Property.fromPlain(propertyPlainFactory.build({ idShort: "Property01", value: "old value" }));
    const submodelElementCollection = SubmodelElementCollection.create({ idShort: "collection" });
    submodelElementCollection.addSubmodelElement(property);

    submodel.addSubmodelElement(submodelElementCollection);
    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const modificationBody = {
      Property01: "value new",
    };

    const response = await request(app.getHttpServer())
      .patch(`${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/collection/$value`)
      .set("Cookie", userCookie)
      .send(modificationBody);
    expect(response.status).toEqual(200);
    expect({ idShort: response.body.value[0].idShort, value: response.body.value[0].value }).toEqual({ idShort: property.idShort, value: "value new" });
  }

  async function assertAddColumn(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    const row0 = SubmodelElementCollection.create({ idShort: "row_0" });
    const col1 = Property.fromPlain(propertyPlainFactory.build({ idShort: "column1" }));
    row0.addSubmodelElement(col1);
    submodelElementList.addSubmodelElement(row0);
    submodel.addSubmodelElement(submodelElementList);

    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const col0Body = propertyPlainFactory.build({ idShort: "column0" });

    const response = await request(app.getHttpServer())
      .post(`${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/tableList/columns?position=0`)
      .set("Cookie", userCookie)
      .send(col0Body);
    expect(response.status).toEqual(201);
    const bodyRow0 = response.body.value[0];
    expect({ idShort: bodyRow0.idShort, value: bodyRow0.value }).toEqual({
      idShort: row0.idShort,
      value: [Property.fromPlain(col0Body).toPlain(), col1.toPlain()],
    });
  }

  async function assertModifyColumn(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    const row0 = SubmodelElementCollection.create({ idShort: "row_0" });
    const col1 = Property.fromPlain(propertyPlainFactory.build({ idShort: "column1" }));
    row0.addSubmodelElement(col1);
    submodelElementList.addSubmodelElement(row0);
    submodel.addSubmodelElement(submodelElementList);

    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const newDisplayNames = [{
      language: "de",
      text: "CO2 Footprint New Text",
    }];
    const colBody = {
      idShort: col1.idShort,
      displayName: newDisplayNames,
    };

    const response = await request(app.getHttpServer())
      .patch(`${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/tableList/columns/${col1.idShort}`)
      .set("Cookie", userCookie)
      .send(colBody);
    expect(response.status).toEqual(200);
    const bodyRow0 = response.body.value[0];
    expect({ idShort: bodyRow0.idShort, value: bodyRow0.value }).toEqual({
      idShort: row0.idShort,
      value: [{ ...col1.toPlain(), displayName: newDisplayNames }],
    });
  }

  async function assertDeleteColumn(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    const row0 = SubmodelElementCollection.create({ idShort: "row_0" });
    const col1 = Property.fromPlain(propertyPlainFactory.build({ idShort: "column1" }));
    row0.addSubmodelElement(col1);
    submodelElementList.addSubmodelElement(row0);
    submodel.addSubmodelElement(submodelElementList);

    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const response = await request(app.getHttpServer())
      .delete(`${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/tableList/columns/${col1.idShort}`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    const bodyRow0 = response.body.value[0];
    expect(bodyRow0.value).toEqual([]);
    const foundSubmodel = await submodelRepository.findOneOrFail(submodel.id);
    const foundList = foundSubmodel.findSubmodelElementOrFail(IdShortPath.create({ path: "tableList" }));
    const tableExtension = new TableExtension(foundList as SubmodelElementList);
    expect(tableExtension.columns).toEqual([]);
  }

  async function assertAddRow(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    const row1 = SubmodelElementCollection.create({ idShort: "row_1" });
    const col1 = Property.fromPlain(propertyPlainFactory.build({ idShort: "column1" }));
    row1.addSubmodelElement(col1);
    submodelElementList.addSubmodelElement(row1);
    submodel.addSubmodelElement(submodelElementList);

    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const response = await request(app.getHttpServer())
      .post(`${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/tableList/rows?position=0`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(201);

    const bodyRow0 = response.body.value[0];
    expect({ value: bodyRow0.value }).toEqual({
      value: row1.toPlain().value.map((col: any) => ({ ...col, value: null })),
    });
    expect(bodyRow0.idShort).not.toEqual(row1.idShort);
  }

  async function assertDeleteRow(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    const row1 = SubmodelElementCollection.create({ idShort: "row_1" });
    const col1 = Property.fromPlain(propertyPlainFactory.build({ idShort: "column1" }));
    row1.addSubmodelElement(col1);
    submodelElementList.addSubmodelElement(row1);
    submodel.addSubmodelElement(submodelElementList);

    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const response = await request(app.getHttpServer())
      .delete(`${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/tableList/rows/${row1.idShort}`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.value).toEqual([]);
    const foundSubmodel = await submodelRepository.findOneOrFail(submodel.id);
    const foundList = foundSubmodel.findSubmodelElementOrFail(IdShortPath.create({ path: "tableList" }));
    const tableExtension = new TableExtension(foundList as SubmodelElementList);
    expect(tableExtension.rows).toEqual([]);
  }

  async function assertDeleteSubmodel(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    const submodel = Submodel.fromPlain(submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }));
    await submodelRepository.save(submodel);
    const submodelRef = Reference.create({
      type: ReferenceTypes.ModelReference,
      keys: [Key.create({ type: KeyTypes.Submodel, value: submodel.id })],
    });

    entity.getEnvironment().addSubmodel(submodel);
    const aasId = entity.getEnvironment().assetAdministrationShells[0]!;
    const assetAdministrationShell = await aasRepository.findOneOrFail(aasId);
    assetAdministrationShell.addSubmodelReference(submodelRef);
    await aasRepository.save(assetAdministrationShell);
    await saveEntity(entity);
    expect(assetAdministrationShell.submodels.some(s => s.keys.some(k => k.value === submodel.id))).toBeTruthy();

    const response = await request(app.getHttpServer())
      .delete(`${basePath}/${entity.id}/submodels/${btoa(submodel.id)}`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(204);
    const foundAas = await aasRepository.findOneOrFail(aasId);
    expect(foundAas.submodels.some(s => s.keys.some(k => k.value === submodel.id))).toBeFalsy();
    expect(await submodelRepository.findOne(submodel.id)).toBeUndefined();
  }

  async function assertDeleteSubmodelElement(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    const submodel = Submodel.fromPlain(submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElement = Property.fromPlain(propertyPlainFactory.build({ idShort: "Property01" }));
    submodel.addSubmodelElement(submodelElement);
    entity.getEnvironment().addSubmodel(submodel);
    await saveEntity(entity);

    const path = `BillOfMaterial.${submodelElement.idShort}`;
    expect(submodel.findSubmodelElement(IdShortPath.create({ path }))).toBeUndefined();

    await submodelRepository.save(submodel);
    const response = await request(app.getHttpServer())
      .delete(`${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/${path}`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(204);
    const foundSubmodel = await submodelRepository.findOneOrFail(submodel.id);
    expect(foundSubmodel.findSubmodelElement(IdShortPath.create({ path }))).toBeUndefined();
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
    getModuleRef: () => moduleRef,
    asserts: {
      getShells: assertGetShells,
      getSubmodels: assertGetSubmodels,
      getSubmodelById: assertGetSubmodelById,
      postSubmodel: assertPostSubmodel,
      modifySubmodel: assertModifySubmodel,
      modifySubmodelElement: assertModifySubmodelElement,
      modifySubmodelElementValue: assertModifySubmodelElementValue,
      addColumn: assertAddColumn,
      modifyColumn: assertModifyColumn,
      deleteColumn: assertDeleteColumn,
      addRow: assertAddRow,
      deleteRow: assertDeleteRow,
      deleteSubmodel: assertDeleteSubmodel,
      deleteSubmodelElement: assertDeleteSubmodelElement,
      getSubmodelValue: assertGetSubmodelValue,
      getSubmodelElements: assertGetSubmodelElements,
      postSubmodelElement: assertPostSubmodelElement,
      postSubmodelElementAtIdShortPath: assertPostSubmodelElementAtIdShortPath,
      getSubmodelElementById: assertGetSubmodelElementById,
      getSubmodelElementValue: assertGetSubmodelElementValue,
    },
  };
}
