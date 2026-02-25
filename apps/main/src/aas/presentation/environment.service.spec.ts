import type { TestingModule } from "@nestjs/testing";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { AssetAdministrationShellCreateDtoSchema, AssetKind } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { AuthModule } from "../../identity/auth/auth.module";
import { OrganizationsModule } from "../../identity/organizations/organizations.module";
import { UsersModule } from "../../identity/users/users.module";
import { AasModule } from "../aas.module";
import { LanguageText } from "../domain/common/language-text";
import { AasRepository } from "../infrastructure/aas.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "../infrastructure/schemas/submodel.schema";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
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
        MongooseModule.forFeature([
          { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
          { name: SubmodelDoc.name, schema: SubmodelSchema },
        ]),
        AasModule,
        AuthModule,
        OrganizationsModule,
        UsersModule,
      ],
      providers: [
        EnvironmentService,
        AasRepository,
        SubmodelRepository,
      ],
    }).compile();
    await module.init();
    environmentService = module.get<EnvironmentService>(EnvironmentService);
    aasRepository = module.get<AasRepository>(AasRepository);
  });

  it("should create environment", async () => {
    const displayName = [{ language: "en", text: "Test AAS" }];
    const description = [{ language: "en", text: "Test AAS description" }];
    const environment = await environmentService.createEnvironment(
      AssetAdministrationShellCreateDtoSchema.parse({ assetInformation: { assetKind: AssetKind.Instance }, displayName, description }),
    );
    expect(environment.assetAdministrationShells).toHaveLength(1);
    const aas = await aasRepository.findOneOrFail(environment.assetAdministrationShells[0]);
    expect(aas.assetInformation.assetKind).toEqual(AssetKind.Instance);
    expect(aas.displayName).toEqual(displayName.map(LanguageText.fromPlain));
    expect(aas.description).toEqual(description.map(LanguageText.fromPlain));
  });

  afterAll(async () => {
    await module.close();
  });
});
