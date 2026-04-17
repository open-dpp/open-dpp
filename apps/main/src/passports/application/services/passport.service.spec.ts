import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { AasModule } from "../../../aas/aas.module";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../../../aas/infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "../../../aas/infrastructure/schemas/submodel.schema";
import { generateMongoConfig } from "../../../database/config";
import { OrganizationsModule } from "../../../identity/organizations/organizations.module";
import { UsersModule } from "../../../identity/users/users.module";
import { PresentationConfigurationsModule } from "../../../presentation-configurations/presentation-configurations.module";
import { PassportRepository } from "../../infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../infrastructure/passport.schema";
import { PassportService } from "./passport.service";

describe("passportService", () => {
  let service: PassportService;
  let module: TestingModule;

  beforeEach(async () => {
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
          { name: PassportDoc.name, schema: PassportSchema },
          { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
          { name: SubmodelDoc.name, schema: SubmodelSchema },
        ]),
        AasModule,
        UsersModule,
        OrganizationsModule,
        PresentationConfigurationsModule,
      ],
      providers: [PassportService, PassportRepository],
    }).compile();

    service = module.get<PassportService>(PassportService);
  });

  afterAll(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
