import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";

import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AdministrativeInformation } from "../domain/common/administrative-information";
import { DataTypeDef } from "../domain/common/data-type-def";
import { LanguageText } from "../domain/common/language-text";
import { Entity, EntityType } from "../domain/submodel-base/entity";
import { Property } from "../domain/submodel-base/property";
import { Submodel } from "../domain/submodel-base/submodel";
import { SubmodelDoc, SubmodelSchema } from "./schemas/submodel.schema";
import { SubmodelService } from "./submodel.service";

describe("submodelService", () => {
  let submodelService: SubmodelService;
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
            name: SubmodelDoc.name,
            schema: SubmodelSchema,
          },
        ]),
      ],
      providers: [
        SubmodelService,
      ],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    submodelService = module.get<SubmodelService>(SubmodelService);
  });

  it("should save a submodel", async () => {
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
    await submodelService.save(submodel);
    const foundSubmodel = await submodelService.findOneOrFail(submodel.id);
    expect(foundSubmodel).toEqual(submodel);
  });

  afterAll(async () => {
    await module.close();
  });
});
