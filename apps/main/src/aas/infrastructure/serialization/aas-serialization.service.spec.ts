import { randomUUID } from "node:crypto";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../../database/config";

import { OrganizationsModule } from "../../../identity/organizations/organizations.module";
import { UsersModule } from "../../../identity/users/users.module";
import { Passport } from "../../../passports/domain/passport";
import { PassportRepository } from "../../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../../passports/infrastructure/passport.schema";
import { Environment } from "../../domain/environment";
import { EnvironmentService } from "../../presentation/environment.service";
import { AasRepository } from "../aas.repository";
import { ConceptDescriptionRepository } from "../concept-description.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../schemas/asset-administration-shell.schema";
import { ConceptDescriptionDoc, ConceptDescriptionSchema } from "../schemas/concept-description.schema";
import { SubmodelDoc, SubmodelSchema } from "../schemas/submodel.schema";
import { SubmodelRepository } from "../submodel.repository";
import { AasSerializationService } from "./aas-serialization.service";

describe("aasSerializationService", () => {
  let aasSerializationService: AasSerializationService;
  let passportRepository: PassportRepository;
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
          {
            name: PassportDoc.name,
            schema: PassportSchema,
          },
          {
            name: ConceptDescriptionDoc.name,
            schema: ConceptDescriptionSchema,
          },
        ]),
        UsersModule,
        OrganizationsModule,
      ],
      providers: [
        EnvironmentService,
        PassportRepository,
        AasRepository,
        SubmodelRepository,
        AasSerializationService,
        ConceptDescriptionRepository,
      ],
    }).compile();

    aasSerializationService = module.get<AasSerializationService>(AasSerializationService);
    passportRepository = module.get<PassportRepository>(PassportRepository);
  });

  it("should export a passport", async () => {
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      }),
    });
    await passportRepository.save(passport);
    const foundAas = await passportRepository.findOneOrFail(passport.id);
    const exportResult = await aasSerializationService.exportPassport(foundAas);
    expect(exportResult).toBeDefined();
    expect(exportResult.format).toBe("open-dpp:json");
    expect(exportResult.version).toBe("1.0");
  });

  afterAll(async () => {
    await module.close();
  });
});
