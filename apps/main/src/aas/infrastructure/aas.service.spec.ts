import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";

import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { UsersService } from "../../users/infrastructure/users.service";
import { AdministrativeInformation } from "../domain/common/administrative-information";
import { DataTypeDef } from "../domain/common/data-type-def";
import { LanguageText } from "../domain/common/language-text";
import { Entity, EntityType } from "../domain/submodelBase/entity";
import { Property } from "../domain/submodelBase/property";
import { Submodel } from "../domain/submodelBase/submodel";
import { AasService } from "./aas.service";
import { SubmodelDoc, SubmodelSchema } from "./schemas/submodelBase/submodel.schema";

describe("aasService", () => {
  let app: INestApplication;
  let aasService: AasService;
  let authService: AuthService;

  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
            name: SubmodelDoc.name,
            schema: SubmodelSchema,
          },
        ]),
        AuthModule,
      ],
      providers: [
        AasService,
        UsersService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    aasService = module.get<AasService>(AasService);
    authService = module.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    app = module.createNestApplication();
    await app.init();

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  it("should save a submodel", async () => {
    const { org, user } = await betterAuthHelper.createOrganizationAndUserWithCookie();

    const entity = Entity.create({
      entityType: EntityType.CoManagedEntity,
      statements: [
        Entity.create({
          entityType: EntityType.CoManagedEntity,
          statements: [
            Property.create(
              {
                value: "http://shells.smartfactory.de/aHR0cHM6Ly9zbWFydGZhY3RvcnkuZGUvc2hlbGxzLy1TUjdCYm5jSkc",
                valueType: DataTypeDef.String,
                category: "CONSTANT",
                description: [
                  LanguageText.create(
                    {
                      language: "en",
                      text: "URL of the application",
                    },
                  ),
                  LanguageText.create({
                    language: "de",
                    text: "URL der Anwendung",
                  }),
                ],
                idShort: "ApplicationURL",
              },
            ),
          ],
        }),
      ],
    });

    const submodel = Submodel.create({
      id: randomUUID(),
      idShort: "carbon footprint",
      administration: AdministrativeInformation.create({ version: "1.0.0", revision: "1" }),
      submodelElements: [
        Property.create({
          idShort: "carbon footprint",
          valueType: DataTypeDef.Double,
          value: "1000",
        }),
        entity,
      ],
    });
    await aasService.saveSubmodel(submodel);
    const foundSubmodel = await aasService.findOneSubmodelOrFail(submodel.id);
    expect(foundSubmodel).toEqual(submodel);
  });
});
