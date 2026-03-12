import type { TestingModule } from "@nestjs/testing";
import type { Model as MongooseModel } from "mongoose";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { AssetKind } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Model } from "mongoose";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../passports/infrastructure/passport.schema";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { AssetInformation } from "../domain/asset-information";
import { AasRepository } from "./aas.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellDocSchemaVersion,
  AssetAdministrationShellSchema,
} from "./schemas/asset-administration-shell.schema";
import { SecurityDbSchema, SecurityDoc } from "./schemas/security/security-db-schema";
import { SubmodelDoc, SubmodelSchema } from "./schemas/submodel.schema";
import { SecurityRepository } from "./security.repository";
import { SubmodelRepository } from "./submodel.repository";

describe("aasRepository", () => {
  let aasRepository: AasRepository;
  let securityRepository: SecurityRepository;
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
            name: SecurityDoc.name,
            schema: SecurityDbSchema,
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
        SecurityRepository,
      ],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    aasRepository = module.get<AasRepository>(AasRepository);
    securityRepository = module.get<SecurityRepository>(SecurityRepository);
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
      security: randomUUID(),
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
    });
    await legacyDoc.save();
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
      security: foundAas.security,
    }));
  });

  it(`should load and migrate aas without security from version $1.1.0 to 1.2.0`, async () => {
    const id = randomUUID();

    const legacyDoc = new AasDoc({
      _id: id,
      _schemaVersion: AssetAdministrationShellDocSchemaVersion.v1_1_0,
      submodels: [],
      assetInformation: {
        assetKind: "Instance",
        specificAssetIds: [],
        globalAssetId: id,
        defaultThumbnails: [],
      },
    });
    await legacyDoc.save();
    const foundAas = await aasRepository.findOneOrFail(id);
    expect(await securityRepository.findOne(foundAas.security)).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
