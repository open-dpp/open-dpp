import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
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
  AssetKind,
  KeyTypes,
  MemberRoleDto,
  PermissionKind,
  Permissions,
  ReferenceTypes,
  SubmodelElementSchema,
  SubmodelJsonSchema,
  SubmodelPaginationResponseDtoSchema,
  UserRoleDto,
} from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import {
  aasPlainFactory,
  propertyInputPlainFactory,
  securityPlainFactory,
  SecurityPlainTransientParams,
  submodelBillOfMaterialPlainFactory,
  submodelCarbonFootprintPlainFactory,
  submodelDesignOfProductPlainFactory,
} from "@open-dpp/testing";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";

import { AuthModule } from "../../identity/auth/auth.module";
import { AUTH } from "../../identity/auth/auth.provider";
import { AuthGuard } from "../../identity/auth/infrastructure/guards/auth.guard";
import { ORGANIZATION_ID_HEADER } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { OrganizationsModule } from "../../identity/organizations/organizations.module";

import { UsersService } from "../../identity/users/application/services/users.service";

import { UsersModule } from "../../identity/users/users.module";
import { MediaModule } from "../../media/media.module";
import { UniqueProductIdentifierRepository } from "../../unique-product-identifier/infrastructure/unique-product-identifier.repository";

import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { AasModule } from "../aas.module";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { AssetInformation } from "../domain/asset-information";
import { IdShortPath } from "../domain/common/id-short-path";
import { Key } from "../domain/common/key";
import { LanguageText } from "../domain/common/language-text";
import { Reference } from "../domain/common/reference";
import { IDigitalProductDocument } from "../../digital-product-document/domain/digital-product-document";
import { IPersistable } from "../domain/persistable";
import { AasAbility } from "../domain/security/aas-ability";
import { Permission } from "../domain/security/permission";
import { Security } from "../domain/security/security";
import { SubjectAttributes } from "../domain/security/subject-attributes";
import { Property } from "../domain/submodel-base/property";
import { Submodel } from "../domain/submodel-base/submodel";
import { SubmodelElementCollection } from "../domain/submodel-base/submodel-element-collection";
import { SubmodelElementList } from "../domain/submodel-base/submodel-element-list";
import { TableExtension } from "../domain/submodel-base/table-extension";
import { AasRepository } from "../infrastructure/aas.repository";
import { ConceptDescriptionRepository } from "../infrastructure/concept-description.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "../infrastructure/schemas/submodel.schema";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import { ActivityHistoryModule } from "../../activity-history/activity-history.module";
import { ActivityRepository } from "../../activity-history/infrastructure/activity.repository";
import { AdministrativeInformation } from "../domain/common/administrative-information";
import { SubmodelActivity } from "../../activity-history/aas/submodel.activity";
import { SubmodelOperationTypes } from "../../activity-history/submodel-operation-types";

export function createAasTestContext<T>(
  basePath: string,
  metadataTestingModule: ModuleMetadata,
  mongooseModels: ModelDefinition[],
  EntityRepositoryClass: new (...args: any[]) => T,
  subject: SubjectAttributes,
) {
  let app: INestApplication;
  let dppIdentifiableRepository: T;
  let submodelRepository: SubmodelRepository;
  let aasRepository: AasRepository;
  let moduleRef: TestingModule;
  let uniqueProductIdentifierRepository: UniqueProductIdentifierRepository;
  let activityRepository: ActivityRepository;

  const betterAuthHelper = new BetterAuthHelper();
  let aas: AssetAdministrationShell;
  let submodels: Submodel[];
  let user1data: any;
  let orga1: any;
  let ability: AasAbility;

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
          {
            name: UniqueProductIdentifierDoc.name,
            schema: UniqueProductIdentifierSchema,
          },
          ...mongooseModels,
        ]),
        ActivityHistoryModule,
        AasModule,
        AuthModule,
        OrganizationsModule,
        UsersModule,
        MediaModule,
        ...(metadataTestingModule.imports || []),
      ],
      providers: [
        AasRepository,
        SubmodelRepository,
        ConceptDescriptionRepository,
        UniqueProductIdentifierRepository,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
        ...(metadataTestingModule.providers || []),
      ],
      controllers: [...(metadataTestingModule.controllers || [])],
    })
      .overrideProvider(EmailService)
      .useValue({
        send: jest.fn(),
      })
      .compile();

    const userService = moduleRef.get<UsersService>(UsersService);
    betterAuthHelper.init(userService, moduleRef.get<Auth>(AUTH));

    app = moduleRef.createNestApplication();
    await app.init();
    dppIdentifiableRepository = moduleRef.get<T>(EntityRepositoryClass);
    aasRepository = moduleRef.get<AasRepository>(AasRepository);
    submodelRepository = moduleRef.get<SubmodelRepository>(SubmodelRepository);
    uniqueProductIdentifierRepository = moduleRef.get<UniqueProductIdentifierRepository>(
      UniqueProductIdentifierRepository,
    );
    activityRepository = moduleRef.get<ActivityRepository>(ActivityRepository);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel1 = Submodel.fromPlain(
      submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const submodel2 = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    user1data = await betterAuthHelper.createUser({ role: subject.userRole });
    if (subject.memberRole === MemberRole.OWNER) {
      orga1 = await betterAuthHelper.createOrganization(user1data?.user.id as string);
    }

    const security = Security.create({});
    [
      IdShortPath.create({ path: submodel1.idShort }),
      IdShortPath.create({ path: submodel2.idShort }),
      IdShortPath.create({ path: submodelBillOfMaterialPlainFactory.build().idShort! }),
      IdShortPath.create({ path: "toDelete" }),
    ].forEach((idShortPath) => {
      security.addPolicy(subject, idShortPath, [
        Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
        Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
        Permission.create({
          permission: Permissions.Delete,
          kindOfPermission: PermissionKind.Allow,
        }),
        Permission.create({
          permission: Permissions.Create,
          kindOfPermission: PermissionKind.Allow,
        }),
      ]);
    });

    ability = security.defineAbilityForSubject(subject, user1data.user.id);

    // { userRole: user, memberRole: owner }
    aas = AssetAdministrationShell.fromPlain(
      aasPlainFactory.build({ security: security.toPlain() }, { transient: { iriDomain } }),
    );

    submodels = [submodel1, submodel2];
    await aasRepository.save(aas);
    for (const s of submodels) {
      await submodelRepository.save(s);
    }
  });

  type CreateEntity = (orgaId?: string) => Promise<IPersistable & IDigitalProductDocument>;
  type SaveEntity = (entity: any) => Promise<IPersistable & IDigitalProductDocument>;

  async function getOrganizationAndUserWithCookie() {
    return orga1
      ? await betterAuthHelper.getOrganizationAndUserWithCookie(orga1.id, user1data.user.id)
      : { ...(await betterAuthHelper.getUserWithCookie(user1data.user.id)), org: undefined };
  }

  async function assertGetShells(createEntity: CreateEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createEntity(org?.id);

    const req = request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/shells?limit=1`)
      .set("Cookie", userCookie);

    if (org?.id) {
      req.set(ORGANIZATION_ID_HEADER, org.id);
    }
    const response = await req.send();
    expect(response.status).toEqual(200);
    expect(response.body.paging_metadata.cursor).toEqual(aas.id);
    expect(response.body.result).toEqual(
      AssetAdministrationShellPaginationResponseDtoSchema.shape.result.parse([
        aas.toPlain({ ability }),
      ]),
    );
  }

  async function assertModifyShell(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const newAas = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: AssetKind.Instance }),
    });
    await aasRepository.save(newAas);
    entity.getEnvironment().addAssetAdministrationShell(newAas);
    await saveEntity(entity);

    const transientParams: SecurityPlainTransientParams = {
      policies: [
        {
          subject: {
            userRole: UserRoleDto.USER,
            memberRole: MemberRoleDto.MEMBER,
          },
          object: { idShortPath: "section1" },
          permissions: [
            {
              permission: Permissions.Read,
              kindOfPermission: PermissionKind.Allow,
            },
            {
              permission: Permissions.Create,
              kindOfPermission: PermissionKind.Allow,
            },
            {
              permission: Permissions.Edit,
              kindOfPermission: PermissionKind.Allow,
            },
          ],
        },
      ],
    };

    const newDisplayName = [{ language: "en", text: "MyAAS" }];

    const body = {
      displayName: newDisplayName,
      security: securityPlainFactory.build(undefined, { transient: transientParams }),
    };
    const response = await request(app.getHttpServer())
      .patch(`${basePath}/${entity.id}/shells/${btoa(newAas.id)}`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id)
      .send(body);
    expect(response.status).toEqual(200);
    expect(response.body.displayName).toEqual(newDisplayName);
    const found = await aasRepository.findOneOrFail(newAas.id);
    expect(found.displayName).toEqual(newDisplayName.map(LanguageText.fromPlain));
    expect(found.security).toEqual(Security.fromPlain(body.security));
  }

  async function assertDeletePolicy(createEntity: CreateEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createEntity(org?.id);
    const user = SubjectAttributes.create({ userRole: UserRoleDto.USER });
    aas.security.addPolicy(user, IdShortPath.create({ path: "section1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    await aasRepository.save(aas);
    const body = {
      subject: user.toPlain(),
      object: "section1",
    };
    const response = await request(app.getHttpServer())
      .delete(`${basePath}/${passport.id}/security/policies`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send(body);

    expect(response.status).toEqual(204);
    const foundAas = await aasRepository.findOneOrFail(aas.id);
    expect(foundAas.security.findPoliciesBySubject(user)).toEqual([]);
  }

  async function assertGetSubmodels(createEntity: CreateEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createEntity(org?.id);

    const req = request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/submodels?limit=2`)
      .set("Cookie", userCookie);

    if (org?.id) {
      req.set(ORGANIZATION_ID_HEADER, org.id);
    }
    const response = await req.send();
    expect(response.status).toEqual(200);
    expect(response.body.paging_metadata.cursor).toEqual(submodels[1].id);
    expect(response.body.result).toEqual(
      SubmodelPaginationResponseDtoSchema.shape.result.parse(submodels.map((s) => s.toPlain())),
    );
  }

  async function assertGetSubmodelById(createEntity: CreateEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createEntity(org?.id);

    const req = request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/submodels/${btoa(submodels[1].id)}`)
      .set("Cookie", userCookie);

    if (org?.id) {
      req.set(ORGANIZATION_ID_HEADER, org.id);
    }

    const response = await req.send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(SubmodelJsonSchema.parse(submodels[1].toPlain()));
  }

  async function assertPostSubmodel(createEntity: CreateEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createEntity(org?.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    const submodelJson = submodelBillOfMaterialPlainFactory.build(undefined, {
      transient: { iriDomain },
    });

    const req = request(app.getHttpServer())
      .post(`${basePath}/${passport.id}/submodels`)
      .set("Cookie", userCookie);

    if (org?.id) {
      req.set(ORGANIZATION_ID_HEADER, org.id);
    }

    const response = await req.send(submodelJson);

    expect(response.status).toEqual(201);
    const foundSubmodel = await submodelRepository.findOneOrFail(response.body.id);
    expect(response.body).toEqual(SubmodelJsonSchema.parse(foundSubmodel.toPlain()));
  }

  async function assertGetSubmodelElements(createEntity: CreateEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const entity = await createEntity(org?.id);
    const req = request(app.getHttpServer())
      .get(`${basePath}/${entity.id}/submodels/${btoa(submodels[1].id)}/submodel-elements`)
      .set("Cookie", userCookie);

    if (org?.id) {
      req.set(ORGANIZATION_ID_HEADER, org.id);
    }
    const response = await req.send();

    expect(response.status).toEqual(200);
    expect(response.body.paging_metadata.cursor).toEqual(
      submodels[1].submodelElements[submodels[1].submodelElements.length - 1].idShort,
    );
    expect(response.body.result).toEqual(
      SubmodelElementSchema.array().parse(submodels[1].submodelElements.map((s) => s.toPlain())),
    );
  }

  async function assertPostSubmodelElement(createEntity: CreateEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const submodelElementJson = propertyInputPlainFactory.build();

    const response = await request(app.getHttpServer())
      .post(`${basePath}/${entity.id}/submodels/${btoa(submodels[1].id)}/submodel-elements`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id)
      .send(submodelElementJson);

    expect(response.status).toEqual(201);
    const foundSubmodelElement = await submodelRepository.findOneOrFail(submodels[1].id);
    expect(response.body).toEqual(
      SubmodelElementSchema.parse(
        foundSubmodelElement
          .findSubmodelElementOrFail(IdShortPath.create({ path: submodelElementJson.idShort }))
          .toPlain(),
      ),
    );
  }

  async function assertGetSubmodelElementById(createEntity: CreateEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const entity = await createEntity(org?.id);
    const req = request(app.getHttpServer())
      .get(
        `${basePath}/${entity.id}/submodels/${btoa(submodels[0].id)}/submodel-elements/Design_V01.Author.AuthorName`,
      )
      .set("Cookie", userCookie);

    if (org?.id) {
      req.set(ORGANIZATION_ID_HEADER, org.id);
    }

    const response = await req.send();

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
        referredSemanticId: null,
        type: "ExternalReference",
      },
      value: "Fabrikvordenker:in ER28-0652",
      valueId: null,
      valueType: "String",
      idShort: "AuthorName",
    });
  }

  async function assertPostSubmodelElementAtIdShortPath(createEntity: CreateEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const submodelElementJson = propertyInputPlainFactory.build();

    const response = await request(app.getHttpServer())
      .post(
        `${basePath}/${entity.id}/submodels/${btoa(submodels[0].id)}/submodel-elements/Design_V01.Author`,
      )
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id)
      .send(submodelElementJson);
    expect(response.status).toEqual(201);
    const foundSubmodelElement = await submodelRepository.findOneOrFail(submodels[0].id);
    expect(response.body).toEqual(
      SubmodelElementSchema.parse(
        foundSubmodelElement
          .findSubmodelElementOrFail(
            IdShortPath.create({ path: `Design_V01.Author.${submodelElementJson.idShort}` }),
          )
          .toPlain(),
      ),
    );
  }

  async function assertGetSubmodelValue(createEntity: CreateEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const entity = await createEntity(org?.id);
    const req = request(app.getHttpServer())
      .get(`${basePath}/${entity.id}/submodels/${btoa(submodels[1].id)}/$value`)
      .set("Cookie", userCookie)
      .send();

    if (org?.id) {
      req.set(ORGANIZATION_ID_HEADER, org.id);
    }

    const response = await req.send();

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
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
    });
  }

  async function assertGetSubmodelElementValue(createEntity: CreateEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const entity = await createEntity(org?.id);
    const req = request(app.getHttpServer())
      .get(
        `${basePath}/${entity.id}/submodels/${btoa(submodels[1].id)}/submodel-elements/ProductCarbonFootprint_A1A3/$value`,
      )
      .set("Cookie", userCookie)
      .send();

    if (org?.id) {
      req.set(ORGANIZATION_ID_HEADER, org.id);
    }
    const response = await req.send();

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
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
    });
  }

  async function assertModifySubmodel(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const entity = await createEntity(org!.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }),
    );

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
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send(modificationBody);
    expect(response.status).toEqual(200);
    expect({
      idShort: response.body.idShort,
      displayName: response.body.displayName,
      description: response.body.description,
    }).toEqual(modificationBody);
  }

  async function assertModifyValueOfSubmodel(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const entity = await createEntity(org!.id);
    const submodel = Submodel.create({
      idShort: submodelBillOfMaterialPlainFactory.build().idShort!,
    });
    const property = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "Property01" }));
    submodel.addSubmodelElement(property, { ability, digitalProductDocumentId: entity.id });
    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);

    await saveEntity(entity);

    const modificationBody = {
      Property01: "value new",
    };

    const response = await request(app.getHttpServer())
      .patch(`${basePath}/${entity.id}/submodels/${submodel.id}/$value`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send(modificationBody);
    expect(response.status).toEqual(200);
    const foundSubmodel = await submodelRepository.findOneOrFail(submodel.id);
    expect((foundSubmodel.submodelElements[0] as Property).value).toEqual("value new");
  }

  async function assertModifySubmodelElement(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const property = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "Property01" }));
    submodel.addSubmodelElement(property, { ability, digitalProductDocumentId: entity.id });
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
      .set(ORGANIZATION_ID_HEADER, org.id)
      .send(modificationBody);
    expect(response.status).toEqual(200);
    expect({
      idShort: response.body.idShort,
      displayName: response.body.displayName,
      description: response.body.description,
    }).toEqual(modificationBody);
  }

  async function assertGetActivities(createEntity: CreateEntity) {
    const { org, userCookie, user } = await getOrganizationAndUserWithCookie();
    const entity = await createEntity(org!.id);

    const activity1 = SubmodelActivity.create({
      digitalProductDocumentId: entity.id,
      userId: user.id,
      submodelId: submodels[0].id,
      fullIdShortPath: IdShortPath.create({ path: `${submodels[0].idShort}.Design_V01.Author` }),
      administration: AdministrativeInformation.create({ version: "1", revision: "0" }),
      operation: SubmodelOperationTypes.SubmodelElementModification,
      oldData: {
        idShort: "Author",
        displayName: [],
      },
      newData: {
        idShort: "Author",
        displayName: [{ language: "en", text: "Author" }],
      },
    });

    const activity2 = SubmodelActivity.create({
      digitalProductDocumentId: entity.id,
      userId: user.id,
      submodelId: submodels[0].id,
      fullIdShortPath: IdShortPath.create({ path: `${submodels[0].idShort}.Design_V01.Model` }),
      administration: AdministrativeInformation.create({ version: "2", revision: "0" }),
      operation: SubmodelOperationTypes.SubmodelElementModification,
      oldData: {
        idShort: "Model",
        displayName: [],
      },
      newData: {
        idShort: "Model",
        displayName: [{ language: "en", text: "Model" }],
      },
    });

    await activityRepository.createMany([activity1, activity2]);

    const response = await request(app.getHttpServer())
      .get(`${basePath}/${entity.id}/activities`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.result).toEqual(
      [activity1.toPlain(), activity2.toPlain()].map((a) => ({
        ...a,
        header: { ...a.header, createdAt: (a.header.createdAt as any).toISOString() },
      })),
    );
  }

  async function assertDownloadActivities(createEntity: CreateEntity) {
    const { org, userCookie, user } = await getOrganizationAndUserWithCookie();

    const entity = await createEntity(org!.id);

    const activity1 = SubmodelActivity.create({
      digitalProductDocumentId: entity.id,
      userId: user.id,
      submodelId: submodels[0].id,
      fullIdShortPath: IdShortPath.create({ path: `${submodels[0].idShort}.Design_V01.Author` }),
      administration: AdministrativeInformation.create({ version: "1", revision: "0" }),
      operation: SubmodelOperationTypes.SubmodelElementModification,
      oldData: {
        idShort: "Author",
        displayName: [],
      },
      newData: {
        idShort: "Author",
        displayName: [{ language: "en", text: "Author" }],
      },
    });

    const activity2 = SubmodelActivity.create({
      digitalProductDocumentId: entity.id,
      userId: user.id,
      submodelId: submodels[0].id,
      fullIdShortPath: IdShortPath.create({ path: `${submodels[0].idShort}.Design_V01.Model` }),
      administration: AdministrativeInformation.create({ version: "2", revision: "0" }),
      operation: SubmodelOperationTypes.SubmodelElementModification,
      oldData: {
        idShort: "Model",
        displayName: [],
      },
      newData: {
        idShort: "Model",
        displayName: [{ language: "en", text: "Model" }],
      },
    });

    await activityRepository.createMany([activity1, activity2]);

    const response = await request(app.getHttpServer())
      .get(`${basePath}/${entity.id}/activities/download`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();
    expect(response.status).toEqual(200);
    expect(response.header["content-type"]).toEqual("application/zip");
    expect(response.header["content-disposition"]).toEqual('attachment; filename="activities.zip"');
  }

  async function assertModifySubmodelElementValue(
    createEntity: CreateEntity,
    saveEntity: SaveEntity,
  ) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const entity = await createEntity(org!.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const submodelElementCollection = SubmodelElementCollection.create({ idShort: "collection" });
    submodel.addSubmodelElement(submodelElementCollection, {
      ability,
      digitalProductDocumentId: entity.id,
    });
    const property = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "Property01", value: "old value" }),
    );

    submodelElementCollection.addSubmodelElement(property, {
      ability,
      digitalProductDocumentId: entity.id,
    });

    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const modificationBody = {
      Property01: "value new",
    };

    const response = await request(app.getHttpServer())
      .patch(
        `${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/collection/$value`,
      )
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send(modificationBody);
    expect(response.status).toEqual(200);
    expect({
      idShort: response.body.value[0].idShort,
      value: response.body.value[0].value,
    }).toEqual({ idShort: property.idShort, value: "value new" });
  }

  async function assertAddColumn(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const submodelElementList = SubmodelElementList.create({
      idShort: "tableList",
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    });
    const row0 = SubmodelElementCollection.create({ idShort: "row_0" });
    const col1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "column1" }));
    submodel.addSubmodelElement(submodelElementList, {
      ability,
      digitalProductDocumentId: entity.id,
    });
    submodelElementList.addSubmodelElement(row0, { ability, digitalProductDocumentId: entity.id });

    row0.addSubmodelElement(col1, { ability, digitalProductDocumentId: entity.id });

    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const col0Body = propertyInputPlainFactory.build({ idShort: "column0" });

    const response = await request(app.getHttpServer())
      .post(
        `${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/tableList/columns?position=0`,
      )
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id)
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

    const submodel = Submodel.fromPlain(
      submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const submodelElementList = SubmodelElementList.create({
      idShort: "tableList",
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    });
    const row0 = SubmodelElementCollection.create({ idShort: "row_0" });
    const col1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "column1" }));
    submodel.addSubmodelElement(submodelElementList, {
      ability,
      digitalProductDocumentId: entity.id,
    });
    submodelElementList.addSubmodelElement(row0, { ability, digitalProductDocumentId: entity.id });

    row0.addSubmodelElement(col1, { ability, digitalProductDocumentId: entity.id });

    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const newDisplayNames = [
      {
        language: "de",
        text: "CO2 Footprint New Text",
      },
    ];
    const colBody = {
      idShort: col1.idShort,
      displayName: newDisplayNames,
    };

    const response = await request(app.getHttpServer())
      .patch(
        `${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/tableList/columns/${col1.idShort}`,
      )
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id)
      .send(colBody);
    expect(response.status).toEqual(200);
    const bodyRow0 = response.body.value[0];
    expect({ idShort: bodyRow0.idShort, value: bodyRow0.value }).toEqual({
      idShort: row0.idShort,
      value: [{ ...col1.toPlain(), displayName: newDisplayNames }],
    });
  }

  async function assertDeleteColumn(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const entity = await createEntity(org!.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const submodelElementList = SubmodelElementList.create({
      idShort: "tableList",
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    });
    const row0 = SubmodelElementCollection.create({ idShort: "row_0" });
    const col1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "column1" }));
    submodel.addSubmodelElement(submodelElementList, {
      ability,
      digitalProductDocumentId: entity.id,
    });
    submodelElementList.addSubmodelElement(row0, { ability, digitalProductDocumentId: entity.id });

    row0.addSubmodelElement(col1, { ability, digitalProductDocumentId: entity.id });

    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const response = await request(app.getHttpServer())
      .delete(
        `${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/tableList/columns/${col1.idShort}`,
      )
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();
    expect(response.status).toEqual(200);
    const bodyRow0 = response.body.value[0];
    expect(bodyRow0.value).toEqual([]);
    const foundSubmodel = await submodelRepository.findOneOrFail(submodel.id);
    const foundList = foundSubmodel.findSubmodelElementOrFail(
      IdShortPath.create({ path: "tableList" }),
    );
    const tableExtension = new TableExtension(foundList as SubmodelElementList);
    expect(tableExtension.columns).toEqual([]);
  }

  async function assertAddRow(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const entity = await createEntity(org.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const submodelElementList = SubmodelElementList.create({
      idShort: "tableList",
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    });
    const row1 = SubmodelElementCollection.create({ idShort: "row_1" });
    const col1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "column1" }));
    submodel.addSubmodelElement(submodelElementList, {
      ability,
      digitalProductDocumentId: entity.id,
    });
    submodelElementList.addSubmodelElement(row1, { ability, digitalProductDocumentId: entity.id });

    row1.addSubmodelElement(col1, { ability, digitalProductDocumentId: entity.id });

    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const response = await request(app.getHttpServer())
      .post(
        `${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/tableList/rows?position=0`,
      )
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id)
      .send();
    expect(response.status).toEqual(201);

    const bodyRow0 = response.body.value[0];
    expect({ value: bodyRow0.value }).toEqual({
      value: row1.toPlain().value.map((col: any) => ({ ...col, value: null })),
    });
    expect(bodyRow0.idShort).not.toEqual(row1.idShort);
  }

  async function assertDeleteRow(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const entity = await createEntity(org!.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const submodelElementList = SubmodelElementList.create({
      idShort: "tableList",
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    });
    const row1 = SubmodelElementCollection.create({ idShort: "row_1" });
    const col1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "column1" }));
    submodel.addSubmodelElement(submodelElementList, {
      ability,
      digitalProductDocumentId: entity.id,
    });
    submodelElementList.addSubmodelElement(row1, { ability, digitalProductDocumentId: entity.id });

    row1.addSubmodelElement(col1, { ability, digitalProductDocumentId: entity.id });

    await submodelRepository.save(submodel);
    entity.getEnvironment().submodels.push(submodel.id);
    await saveEntity(entity);

    const response = await request(app.getHttpServer())
      .delete(
        `${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/tableList/rows/${row1.idShort}`,
      )
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body.value).toEqual([]);
    const foundSubmodel = await submodelRepository.findOneOrFail(submodel.id);
    const foundList = foundSubmodel.findSubmodelElementOrFail(
      IdShortPath.create({ path: "tableList" }),
    );
    const tableExtension = new TableExtension(foundList as SubmodelElementList);
    expect(tableExtension.rows).toEqual([]);
  }

  async function assertDeleteSubmodel(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const entity = await createEntity(org!.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    const submodel = Submodel.fromPlain(
      submodelBillOfMaterialPlainFactory.build(
        { idShort: "toDelete" },
        { transient: { iriDomain } },
      ),
    );
    await submodelRepository.save(submodel);
    const submodelRef = Reference.create({
      type: ReferenceTypes.ModelReference,
      keys: [Key.create({ type: KeyTypes.Submodel, value: submodel.id })],
    });

    entity.getEnvironment().addSubmodel(submodel, { ability, digitalProductDocumentId: entity.id });
    const aasId = entity.getEnvironment().assetAdministrationShells[0]!;
    const assetAdministrationShell = await aasRepository.findOneOrFail(aasId);
    assetAdministrationShell.addSubmodelReference(submodelRef);
    await aasRepository.save(assetAdministrationShell);
    await saveEntity(entity);
    expect(
      assetAdministrationShell.submodels.some((s) => s.keys.some((k) => k.value === submodel.id)),
    ).toBeTruthy();

    const response = await request(app.getHttpServer())
      .delete(`${basePath}/${entity.id}/submodels/${btoa(submodel.id)}`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();
    expect(response.status).toEqual(204);
    const foundAas = await aasRepository.findOneOrFail(aasId);
    expect(foundAas.submodels.some((s) => s.keys.some((k) => k.value === submodel.id))).toBeFalsy();
    expect(await submodelRepository.findOne(submodel.id)).toBeUndefined();
  }

  async function assertDeleteSubmodelElement(createEntity: CreateEntity, saveEntity: SaveEntity) {
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const entity = await createEntity(org!.id);
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    const submodel = Submodel.fromPlain(
      submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const submodelElement = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "Property01" }),
    );
    submodel.addSubmodelElement(submodelElement, { ability, digitalProductDocumentId: entity.id });
    entity.getEnvironment().addSubmodel(submodel, { ability, digitalProductDocumentId: entity.id });
    await saveEntity(entity);

    const path = submodelElement.idShort;

    expect(submodel.findSubmodelElement(IdShortPath.create({ path }))).toBeDefined();

    await submodelRepository.save(submodel);
    const response = await request(app.getHttpServer())
      .delete(`${basePath}/${entity.id}/submodels/${btoa(submodel.id)}/submodel-elements/${path}`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();
    expect(response.status).toEqual(204);
    const foundSubmodel = await submodelRepository.findOneOrFail(submodel.id);
    expect(foundSubmodel.findSubmodelElement(IdShortPath.create({ path }))).toBeUndefined();
  }

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  return {
    globals: () => ({
      app,
      betterAuthHelper,
      organizationId: orga1?.id,
      userId: user1data.user.id,
      getOrganizationAndUserWithCookie,
    }),
    getRepositories: () => ({
      dppIdentifiableRepository,
      aasRepository,
      submodelRepository,
      uniqueProductIdentifierService: uniqueProductIdentifierRepository,
    }),
    getAasObjects: () => ({ aas, submodels }),
    getModuleRef: () => moduleRef,
    asserts: {
      getShells: assertGetShells,
      modifyShell: assertModifyShell,
      getSubmodels: assertGetSubmodels,
      getSubmodelById: assertGetSubmodelById,
      postSubmodel: assertPostSubmodel,
      modifySubmodel: assertModifySubmodel,
      modifyValueOfSubmodel: assertModifyValueOfSubmodel,
      modifySubmodelElement: assertModifySubmodelElement,
      modifySubmodelElementValue: assertModifySubmodelElementValue,
      addColumn: assertAddColumn,
      modifyColumn: assertModifyColumn,
      deleteColumn: assertDeleteColumn,
      addRow: assertAddRow,
      deletePolicy: assertDeletePolicy,
      deleteRow: assertDeleteRow,
      deleteSubmodel: assertDeleteSubmodel,
      deleteSubmodelElement: assertDeleteSubmodelElement,
      getSubmodelValue: assertGetSubmodelValue,
      getSubmodelElements: assertGetSubmodelElements,
      postSubmodelElement: assertPostSubmodelElement,
      postSubmodelElementAtIdShortPath: assertPostSubmodelElementAtIdShortPath,
      getSubmodelElementById: assertGetSubmodelElementById,
      getSubmodelElementValue: assertGetSubmodelElementValue,
      getActivities: assertGetActivities,
      downloadActivities: assertDownloadActivities,
    },
  };
}
