import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";

import { generateMongoConfig } from "../../database/config";

import { Environment } from "../domain/environment";
import { Template } from "../domain/template";
import { TemplateDoc, TemplateSchema } from "./schemas/template.schema";
import { TemplateRepository } from "./template.repository";

describe("templateRepository", () => {
  let templateRepository: TemplateRepository;
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
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
        ]),
      ],
      providers: [
        TemplateRepository,
      ],
    }).compile();

    templateRepository = module.get<TemplateRepository>(TemplateRepository);
  });

  it("should save a template", async () => {
    const template = Template.create({
      id: randomUUID(),
      organizationId: randomUUID(),
      environment: Environment.create({
        assetAdministrationShells: [randomUUID()],
        submodels: [randomUUID()],
        conceptDescriptions: [randomUUID()],
      }),
    });
    await templateRepository.save(template);
    const foundTemplate = await templateRepository.findOneOrFail(template.id);
    expect(foundTemplate).toEqual(template);
  });

  afterAll(async () => {
    await module.close();
  });
});
