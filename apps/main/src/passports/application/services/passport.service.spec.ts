import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { AasModule } from "../../../aas/aas.module";
import { AasRepository } from "../../../aas/infrastructure/aas.repository";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../../../aas/infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "../../../aas/infrastructure/schemas/submodel.schema";
import { SubmodelRepository } from "../../../aas/infrastructure/submodel.repository";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { generateMongoConfig } from "../../../database/config";
import { OrganizationsModule } from "../../../identity/organizations/organizations.module";
import { UsersModule } from "../../../identity/users/users.module";
import { PassportRepository } from "../../infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../infrastructure/passport.schema";
import { PassportService } from "./passport.service";

describe("passportService", () => {
  let service: PassportService;
  let module: TestingModule;

  afterAll(async () => {
    await module.close();
  });

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
      ],
      providers: [
        PassportService,
        PassportRepository,
        EnvironmentService,
        AasRepository,
        SubmodelRepository,
      ],
    }).compile();

    service = module.get<PassportService>(PassportService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
