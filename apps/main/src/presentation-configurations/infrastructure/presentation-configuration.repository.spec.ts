import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { KeyTypes, PresentationComponentName, PresentationReferenceType } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import type { Connection } from "mongoose";

import { generateMongoConfig } from "../../database/config";
import { PresentationConfiguration } from "../domain/presentation-configuration";
import { PresentationConfigurationRepository } from "./presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "./presentation-configuration.schema";

describe("presentationConfigurationRepository", () => {
  let repository: PresentationConfigurationRepository;
  let connection: Connection;
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
    connection = module.get<Connection>(getConnectionToken());
  });

  it("persists a presentation configuration and loads it back by id", async () => {
    const config = PresentationConfiguration.create({
      organizationId: "org-1",
      referenceId: randomUUID(),
      referenceType: PresentationReferenceType.Template,
      elementDesign: { "submodel-1.prop-1": PresentationComponentName.BigNumber },
      defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
    });

    await repository.save(config);
    const found = await repository.findOneOrFail(config.id);

    expect(found.id).toBe(config.id);
    expect(Object.fromEntries(found.elementDesign)).toEqual({
      "submodel-1.prop-1": PresentationComponentName.BigNumber,
    });
    expect(Object.fromEntries(found.defaultComponents)).toEqual({
      [KeyTypes.Property]: PresentationComponentName.BigNumber,
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

  it("counts presentation configurations by reference", async () => {
    const referenceId = randomUUID();
    const missingBefore = await repository.countByReference({
      referenceType: PresentationReferenceType.Passport,
      referenceId,
    });
    expect(missingBefore).toBe(0);

    const config = PresentationConfiguration.create({
      organizationId: "org-count",
      referenceId,
      referenceType: PresentationReferenceType.Passport,
    });
    await repository.save(config);

    const count = await repository.countByReference({
      referenceType: PresentationReferenceType.Passport,
      referenceId,
    });
    expect(count).toBe(1);
  });

  it("rejects a duplicate (referenceType, referenceId) save (unique index)", async () => {
    const referenceId = randomUUID();
    await repository.save(
      PresentationConfiguration.create({
        organizationId: "org-dup",
        referenceId,
        referenceType: PresentationReferenceType.Passport,
      }),
    );

    await expect(
      repository.save(
        PresentationConfiguration.create({
          organizationId: "org-dup",
          referenceId,
          referenceType: PresentationReferenceType.Passport,
        }),
      ),
    ).rejects.toThrow();
  });

  it("rolls back save inside an aborted session transaction", async () => {
    const referenceId = randomUUID();
    const session = await connection.startSession();
    try {
      session.startTransaction();
      await repository.save(
        PresentationConfiguration.create({
          organizationId: "org-tx",
          referenceId,
          referenceType: PresentationReferenceType.Template,
        }),
        { session },
      );
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }

    const found = await repository.findByReference({
      referenceType: PresentationReferenceType.Template,
      referenceId,
    });
    expect(found).toBeUndefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
