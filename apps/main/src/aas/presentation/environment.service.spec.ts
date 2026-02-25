import type { TestingModule } from "@nestjs/testing";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { AssetKind, LanguageTextDto } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { AuthModule } from "../../identity/auth/auth.module";
import { OrganizationsModule } from "../../identity/organizations/organizations.module";
import { UsersModule } from "../../identity/users/users.module";
import { AasModule } from "../aas.module";
import { LanguageText } from "../domain/common/language-text";

import { AasRepository } from "../infrastructure/aas.repository";

import { EnvironmentService } from "./environment.service";

describe("environmentService", () => {
  let environmentService: EnvironmentService;
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
        AasModule,
        AuthModule,
        OrganizationsModule,
        UsersModule,
      ],
    }).compile();
    await module.init();
    environmentService = module.get<EnvironmentService>(EnvironmentService);
    aasRepository = module.get<AasRepository>(AasRepository);
  });

  it("should create environment", async () => {
    const displayName: LanguageTextDto[] = [{ language: "en", text: "Test AAS" }];
    const description: LanguageTextDto[] = [{ language: "en", text: "Test AAS description" }];
    const environment = await environmentService.createEnvironment({
      assetAdministrationShells: [{ displayName, description }],
    }, true);
    expect(environment.assetAdministrationShells).toHaveLength(1);
    const aas = await aasRepository.findOneOrFail(environment.assetAdministrationShells[0]);
    expect(aas.assetInformation.assetKind).toEqual(AssetKind.Type);
    expect(aas.displayName).toEqual(displayName.map(LanguageText.fromPlain));
    expect(aas.description).toEqual(description.map(LanguageText.fromPlain));
  });

  it("should create environment with empty aas", async () => {
    const environment = await environmentService.createEnvironment({
      assetAdministrationShells: [],
    }, false);
    expect(environment.assetAdministrationShells).toHaveLength(1);
    const aas = await aasRepository.findOneOrFail(environment.assetAdministrationShells[0]);
    expect(aas.assetInformation.assetKind).toEqual(AssetKind.Instance);
  });

  afterAll(async () => {
    await module.close();
  });
});
