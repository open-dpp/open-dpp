import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { DataTypeDef, EntityType, ModellingKindType } from "@open-dpp/aas";

import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { AdministrativeInformation } from "../domain/common/administrative-information";
import { LanguageText } from "../domain/common/language-text";
import { Entity } from "../domain/submodel-base/entity";
import { Property } from "../domain/submodel-base/property";
import { Submodel } from "../domain/submodel-base/submodel";
import { SubmodelRegistryInitializer } from "../presentation/submodel-registry-initializer";
import { SubmodelDoc, SubmodelSchema } from "./schemas/submodel.schema";
import { SubmodelRepository } from "./submodel.repository";

describe("submodelRepository", () => {
  let t: ModellingKindType;
  let submodelRepository: SubmodelRepository;
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
        SubmodelRegistryInitializer,
        SubmodelRepository,
      ],
    }).compile();
    await module.init();
    submodelRepository = module.get<SubmodelRepository>(SubmodelRepository);
  });

  it("should save a submodel", async () => {
    const entity = Entity.create({
      entityType: EntityType.CoManagedEntity,
      idShort: "EntityId",
      statements: [
        Entity.create({
          entityType: EntityType.CoManagedEntity,
          idShort: "EntitySubId",
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
    await submodelRepository.save(submodel);
    const foundSubmodel = await submodelRepository.findOneOrFail(submodel.id);
    expect(foundSubmodel).toEqual(submodel);
  });

  afterAll(async () => {
    await module.close();
  });
});
