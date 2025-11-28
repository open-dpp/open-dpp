import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";

import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";

import { ConceptDescription } from "../domain/concept-description";
import { ConceptDescriptionRepository } from "./concept-description.repository";
import { ConceptDescriptionDoc, ConceptDescriptionSchema } from "./schemas/concept-description.schema";

describe("conceptDescriptionRepository", () => {
  let conceptDescriptionRepository: ConceptDescriptionRepository;
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
            name: ConceptDescriptionDoc.name,
            schema: ConceptDescriptionSchema,
          },
        ]),
      ],
      providers: [
        ConceptDescriptionRepository,
      ],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    conceptDescriptionRepository = module.get<ConceptDescriptionRepository>(ConceptDescriptionRepository);
  });

  it("should save a concept description", async () => {
    const conceptDescription = ConceptDescription.create({
      id: randomUUID(),
    });
    await conceptDescriptionRepository.save(conceptDescription);
    const foundAas = await conceptDescriptionRepository.findOneOrFail(conceptDescription.id);
    expect(foundAas).toEqual(conceptDescription);
  });

  afterAll(async () => {
    await module.close();
  });
});
