import type { TestingModule } from "@nestjs/testing";
import type { Model as MongooseModel } from "mongoose";
import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { AssetKind } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Model } from "mongoose";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { AssetInformation } from "../domain/asset-information";
import { AasRepository } from "./aas.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellDocSchemaVersion,
  AssetAdministrationShellSchema,
} from "./schemas/asset-administration-shell.schema";

describe("aasRepository", () => {
  let aasRepository: AasRepository;
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
        ]),
      ],
      providers: [
        AasRepository,
      ],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    aasRepository = module.get<AasRepository>(AasRepository);
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

  it(`should load and migrate aas from version ${AssetAdministrationShellDocSchemaVersion.v1_0_0} to ${AssetAdministrationShellDocSchemaVersion.v1_1_0}`, async () => {
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
    }));
  });

  afterAll(async () => {
    await module.close();
  });
});
