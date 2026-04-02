import type { TestingModule } from "@nestjs/testing";
import type { Model as MongooseModel } from "mongoose";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { AasSubmodelElements, AssetKind, Permissions, ReferenceTypes } from "@open-dpp/dto";

import { EnvModule, EnvService } from "@open-dpp/env";
import { Model } from "mongoose";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../passports/infrastructure/passport.schema";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { AssetInformation } from "../domain/asset-information";
import { IdShortPath } from "../domain/common/id-short-path";
import { Security } from "../domain/security/security";
import { SubjectAttributes } from "../domain/security/subject-attributes";
import { Submodel } from "../domain/submodel-base/submodel";
import { AasRepository } from "./aas.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellDocSchemaVersion,
  AssetAdministrationShellSchema,
} from "./schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "./schemas/submodel.schema";
import { SubmodelRepository } from "./submodel.repository";

describe("aasRepository", () => {
  let aasRepository: AasRepository;
  let submodelRepository: SubmodelRepository;
  let module: TestingModule;

  let AasDoc: MongooseModel<AssetAdministrationShellDoc>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
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
            name: AssetAdministrationShellDoc.name,
            schema: AssetAdministrationShellSchema,
          },
          {
            name: SubmodelDoc.name,
            schema: SubmodelSchema,
          },
          {
            name: PassportDoc.name,
            schema: PassportSchema,
          },
        ]),
      ],
      providers: [
        PassportRepository,
        AasRepository,
        SubmodelRepository,
      ],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    aasRepository = module.get<AasRepository>(AasRepository);
    submodelRepository = module.get<SubmodelRepository>(SubmodelRepository);
    AasDoc = module.get<Model<AssetAdministrationShellDoc>>(
      getModelToken(AssetAdministrationShellDoc.name),
    );
  });

  it("should save a aas", async () => {
    const id = randomUUID();
    const aas = AssetAdministrationShell.create({
      id,
      assetInformation: AssetInformation.create({
        assetKind: AssetKind.Instance,
      }),
    });
    await aasRepository.save(aas);
    const foundAas = await aasRepository.findOneOrFail(aas.id);
    expect(foundAas).toEqual(aas);
  });

  it(`should load and migrate aas from version 1.0.0 to 1.2.0`, async () => {
    const id = randomUUID();
    const legacyDoc = new AasDoc({
      _id: id,
      _schemaVersion: AssetAdministrationShellDocSchemaVersion.v1_0_0,
      assetInformation: {
        assetKind: "Instance",
        specificAssetIds: [],
        globalAssetId: id,
        defaultThumbnail: {
          path: "https://example.png",
          contentType: "image/png",
        },
      },
      submodels: [],
    });
    await legacyDoc.save({ validateBeforeSave: false });
    const foundAas = await aasRepository.findOneOrFail(id);
    expect(foundAas).toEqual(AssetAdministrationShell.fromPlain({
      id,
      assetInformation: {
        assetKind: AssetKind.Instance,
        defaultThumbnails: [{
          path: "https://example.png",
          contentType: "image/png",
        }],
        specificAssetIds: [],
        globalAssetId: id,
      },
      security: Security.create({}).toPlain(),
    }));
  });

  it(`should load and migrate aas without security from version $1.1.0 to 1.2.0`, async () => {
    const id = randomUUID();
    const submodel1 = Submodel.create({ idShort: "submodel1" });
    const submodel2 = Submodel.create({ idShort: "submodel2" });
    await submodelRepository.save(submodel1);
    await submodelRepository.save(submodel2);
    const submodelReferences = [{
      type: ReferenceTypes.ModelReference,
      referredSemanticId: null,
      keys: [
        {
          type: AasSubmodelElements.SubmodelElement,
          value: submodel1.id,
        },
      ],
    }, {
      type: ReferenceTypes.ModelReference,
      referredSemanticId: null,
      keys: [
        {
          type: AasSubmodelElements.SubmodelElement,
          value: submodel2.id,
        },
      ],
    }];

    const legacyDoc = new AasDoc({
      _id: id,
      _schemaVersion: AssetAdministrationShellDocSchemaVersion.v1_1_0,
      submodels: submodelReferences,
      assetInformation: {
        assetKind: "Instance",
        specificAssetIds: [],
        globalAssetId: id,
        defaultThumbnails: [],
      },
    });
    await legacyDoc.save({ validateBeforeSave: false });
    const foundAas = await aasRepository.findOneOrFail(id);
    const security = foundAas.security;
    // admin should have all permissions
    let ability = security.defineAbilityForSubject(SubjectAttributes.create({ userRole: UserRole.ADMIN }));
    for (const permission of [Permissions.Create, Permissions.Read, Permissions.Edit, Permissions.Delete]) {
      expect(ability.can(permission, IdShortPath.create({ path: submodel1.idShort }))).toBeTruthy();
      expect(ability.can(permission, IdShortPath.create({ path: submodel2.idShort }))).toBeTruthy();
    }

    // member of the organization to which the passport belongs to should have all permissions
    ability = security.defineAbilityForSubject(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }));
    for (const permission of [Permissions.Create, Permissions.Read, Permissions.Edit, Permissions.Delete]) {
      expect(ability.can(permission, IdShortPath.create({ path: submodel1.idShort }))).toBeTruthy();
      expect(ability.can(permission, IdShortPath.create({ path: submodel2.idShort }))).toBeTruthy();
    }

    // anonymous user should have only read permissions
    ability = security.defineAbilityForSubject(SubjectAttributes.create({ userRole: UserRole.ANONYMOUS }));
    expect(ability.can(Permissions.Read, IdShortPath.create({ path: submodel1.idShort }))).toBeTruthy();
    expect(ability.can(Permissions.Read, IdShortPath.create({ path: submodel2.idShort }))).toBeTruthy();

    for (const permission of [Permissions.Create, Permissions.Edit, Permissions.Delete]) {
      expect(ability.can(permission, IdShortPath.create({ path: submodel1.idShort }))).toBeFalsy();
      expect(ability.can(permission, IdShortPath.create({ path: submodel2.idShort }))).toBeFalsy();
    }
  });

  afterAll(async () => {
    await module.close();
  });
});
