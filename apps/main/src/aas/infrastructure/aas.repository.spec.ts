import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { AssetKind } from "@open-dpp/dto";

import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { AssetInformation } from "../domain/asset-information";
import { AasRepository } from "./aas.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "./schemas/asset-administration-shell.schema";

describe("aasRepository", () => {
  let aasRepository: AasRepository;
  let module: TestingModule;
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
  });

  it("should save a aas", async () => {
    const aas = AssetAdministrationShell.create({
      id: randomUUID(),
      assetInformation: AssetInformation.create({
        assetKind: AssetKind.Instance,
      }),
    });
    await aasRepository.save(aas);
    const foundAas = await aasRepository.findOneOrFail(aas.id);
    expect(foundAas).toEqual(aas);
  });

  afterAll(async () => {
    await module.close();
  });
});
