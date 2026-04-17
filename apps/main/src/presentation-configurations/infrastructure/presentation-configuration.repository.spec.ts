import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { KeyTypes, PresentationReferenceType } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";

import { generateMongoConfig } from "../../database/config";
import { PresentationConfiguration } from "../domain/presentation-configuration";
import { PresentationConfigurationRepository } from "./presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "./presentation-configuration.schema";

describe("presentationConfigurationRepository", () => {
  let repository: PresentationConfigurationRepository;
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
            name: PresentationConfigurationDoc.name,
            schema: PresentationConfigurationSchema,
          },
        ]),
      ],
      providers: [PresentationConfigurationRepository],
    }).compile();

    repository = module.get<PresentationConfigurationRepository>(
      PresentationConfigurationRepository,
    );
  });

  it("persists a presentation configuration and loads it back by id", async () => {
    const config = PresentationConfiguration.create({
      organizationId: "org-1",
      referenceId: randomUUID(),
      referenceType: PresentationReferenceType.Template,
      elementDesign: { "submodel-1.prop-1": "TextField" },
      defaultComponents: { [KeyTypes.Property]: "TextField" },
    });

    await repository.save(config);
    const found = await repository.findOneOrFail(config.id);

    expect(found.id).toBe(config.id);
    expect(Object.fromEntries(found.elementDesign)).toEqual({
      "submodel-1.prop-1": "TextField",
    });
    expect(Object.fromEntries(found.defaultComponents)).toEqual({
      [KeyTypes.Property]: "TextField",
    });
  });

  it("finds a presentation configuration by reference", async () => {
    const referenceId = randomUUID();
    const config = PresentationConfiguration.create({
      organizationId: "org-2",
      referenceId,
      referenceType: PresentationReferenceType.Passport,
    });
    await repository.save(config);

    const found = await repository.findByReference({
      referenceType: PresentationReferenceType.Passport,
      referenceId,
    });
    expect(found?.id).toBe(config.id);

    const missing = await repository.findByReference({
      referenceType: PresentationReferenceType.Passport,
      referenceId: randomUUID(),
    });
    expect(missing).toBeUndefined();
  });

  it("findOrCreateByReference creates a fresh configuration and then reuses it", async () => {
    const referenceId = randomUUID();
    const first = await repository.findOrCreateByReference({
      referenceType: PresentationReferenceType.Template,
      referenceId,
      organizationId: "org-3",
    });

    const second = await repository.findOrCreateByReference({
      referenceType: PresentationReferenceType.Template,
      referenceId,
      organizationId: "org-3",
    });

    expect(second.id).toBe(first.id);
  });

  afterAll(async () => {
    await module.close();
  });
});
