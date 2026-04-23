import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
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

  it("findOrCreateByReference retries via findByReference when save hits a duplicate-key error", async () => {
    const referenceId = randomUUID();
    const organizationId = "org-retry";
    const winner = PresentationConfiguration.create({
      organizationId,
      referenceId,
      referenceType: PresentationReferenceType.Passport,
    });
    await repository.save(winner);

    const findByReferenceSpy = jest
      .spyOn(repository, "findByReference")
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(winner);
    const saveSpy = jest
      .spyOn(repository, "save")
      .mockRejectedValueOnce(Object.assign(new Error("E11000 duplicate key"), { code: 11000 }));

    try {
      const result = await repository.findOrCreateByReference({
        referenceType: PresentationReferenceType.Passport,
        referenceId,
        organizationId,
      });

      expect(result.id).toBe(winner.id);
      expect(findByReferenceSpy).toHaveBeenCalledTimes(2);
      expect(saveSpy).toHaveBeenCalledTimes(1);
    } finally {
      findByReferenceSpy.mockRestore();
      saveSpy.mockRestore();
    }
  });

  it("findOrCreateByReference re-throws non-duplicate save errors", async () => {
    const referenceId = randomUUID();
    const findByReferenceSpy = jest
      .spyOn(repository, "findByReference")
      .mockResolvedValueOnce(undefined);
    const saveSpy = jest.spyOn(repository, "save").mockRejectedValueOnce(new Error("network fail"));

    try {
      await expect(
        repository.findOrCreateByReference({
          referenceType: PresentationReferenceType.Passport,
          referenceId,
          organizationId: "org-err",
        }),
      ).rejects.toThrow("network fail");

      expect(findByReferenceSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledTimes(1);
    } finally {
      findByReferenceSpy.mockRestore();
      saveSpy.mockRestore();
    }
  });

  it("findOrCreateByReference surfaces the original error when duplicate-key retry finds nothing", async () => {
    const referenceId = randomUUID();
    const findByReferenceSpy = jest
      .spyOn(repository, "findByReference")
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);
    const saveSpy = jest
      .spyOn(repository, "save")
      .mockRejectedValueOnce(Object.assign(new Error("E11000 duplicate key"), { code: 11000 }));

    try {
      await expect(
        repository.findOrCreateByReference({
          referenceType: PresentationReferenceType.Passport,
          referenceId,
          organizationId: "org-ghost",
        }),
      ).rejects.toThrow("E11000 duplicate key");

      expect(findByReferenceSpy).toHaveBeenCalledTimes(2);
    } finally {
      findByReferenceSpy.mockRestore();
      saveSpy.mockRestore();
    }
  });

  it("findOrCreateByReference recovers when E11000 surfaces via error.cause.code", async () => {
    const referenceId = randomUUID();
    const organizationId = "org-cause";
    const winner = PresentationConfiguration.create({
      organizationId,
      referenceId,
      referenceType: PresentationReferenceType.Passport,
    });

    const findByReferenceSpy = jest
      .spyOn(repository, "findByReference")
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(winner);
    const wrappedError = Object.assign(new Error("duplicate"), {
      cause: { code: 11000 },
    });
    const saveSpy = jest.spyOn(repository, "save").mockRejectedValueOnce(wrappedError);

    try {
      const result = await repository.findOrCreateByReference({
        referenceType: PresentationReferenceType.Passport,
        referenceId,
        organizationId,
      });

      expect(result.id).toBe(winner.id);
      expect(findByReferenceSpy).toHaveBeenCalledTimes(2);
      expect(saveSpy).toHaveBeenCalledTimes(1);
    } finally {
      findByReferenceSpy.mockRestore();
      saveSpy.mockRestore();
    }
  });

  it("findOrCreateByReference recovers when E11000 surfaces via error.writeErrors[0].code", async () => {
    const referenceId = randomUUID();
    const organizationId = "org-bulk";
    const winner = PresentationConfiguration.create({
      organizationId,
      referenceId,
      referenceType: PresentationReferenceType.Passport,
    });

    const findByReferenceSpy = jest
      .spyOn(repository, "findByReference")
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(winner);
    const bulkError = Object.assign(new Error("bulk"), {
      writeErrors: [{ code: 11000 }],
    });
    const saveSpy = jest.spyOn(repository, "save").mockRejectedValueOnce(bulkError);

    try {
      const result = await repository.findOrCreateByReference({
        referenceType: PresentationReferenceType.Passport,
        referenceId,
        organizationId,
      });

      expect(result.id).toBe(winner.id);
      expect(findByReferenceSpy).toHaveBeenCalledTimes(2);
      expect(saveSpy).toHaveBeenCalledTimes(1);
    } finally {
      findByReferenceSpy.mockRestore();
      saveSpy.mockRestore();
    }
  });

  it("findOrCreateByReference does not misrecover on non-duplicate errors nested in cause", async () => {
    const referenceId = randomUUID();
    const findByReferenceSpy = jest
      .spyOn(repository, "findByReference")
      .mockResolvedValueOnce(undefined);
    const unrelated = Object.assign(new Error("network"), {
      cause: { code: 99 },
    });
    const saveSpy = jest.spyOn(repository, "save").mockRejectedValueOnce(unrelated);

    try {
      await expect(
        repository.findOrCreateByReference({
          referenceType: PresentationReferenceType.Passport,
          referenceId,
          organizationId: "org-nested-other",
        }),
      ).rejects.toThrow("network");

      expect(findByReferenceSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledTimes(1);
    } finally {
      findByReferenceSpy.mockRestore();
      saveSpy.mockRestore();
    }
  });

  it("findOrCreateByReference logs a warning when recovering from a duplicate-key race", async () => {
    const referenceId = randomUUID();
    const organizationId = "org-race-log";
    const winner = PresentationConfiguration.create({
      organizationId,
      referenceId,
      referenceType: PresentationReferenceType.Passport,
    });

    const findByReferenceSpy = jest
      .spyOn(repository, "findByReference")
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(winner);
    const saveSpy = jest
      .spyOn(repository, "save")
      .mockRejectedValueOnce(Object.assign(new Error("E11000 duplicate key"), { code: 11000 }));

    const repoLogger = (repository as unknown as { logger: Logger }).logger;
    const warnSpy = jest.spyOn(repoLogger, "warn").mockImplementation(() => {});

    try {
      await repository.findOrCreateByReference({
        referenceType: PresentationReferenceType.Passport,
        referenceId,
        organizationId,
      });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(referenceId));
    } finally {
      findByReferenceSpy.mockRestore();
      saveSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });

  it("findOrCreateByReference rolls back when the session transaction aborts", async () => {
    const referenceId = randomUUID();
    const session = await connection.startSession();
    try {
      session.startTransaction();
      await repository.findOrCreateByReference(
        {
          referenceType: PresentationReferenceType.Template,
          referenceId,
          organizationId: "org-tx",
        },
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

  it("findOrCreateByReference propagates E11000 inside a transaction without re-reading on the aborted session", async () => {
    // Inside a transaction, MongoDB aborts on E11000 and the session can no
    // longer be used for reads. The repository must surface the error and
    // NOT attempt the race-recovery re-read — callers retry at the
    // transaction boundary.
    const referenceId = randomUUID();

    const findByReferenceSpy = jest
      .spyOn(repository, "findByReference")
      .mockResolvedValueOnce(undefined);
    const saveSpy = jest
      .spyOn(repository, "save")
      .mockRejectedValueOnce(Object.assign(new Error("E11000 duplicate key"), { code: 11000 }));

    const session = await connection.startSession();
    try {
      session.startTransaction();
      await expect(
        repository.findOrCreateByReference(
          {
            referenceType: PresentationReferenceType.Template,
            referenceId,
            organizationId: "org-tx-e11000",
          },
          { session },
        ),
      ).rejects.toThrow(/E11000/);

      // Retry read must NOT have been attempted: findByReferenceSpy called
      // exactly once (the initial lookup), not twice.
      expect(findByReferenceSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledTimes(1);

      await session.abortTransaction();
    } finally {
      await session.endSession();
      findByReferenceSpy.mockRestore();
      saveSpy.mockRestore();
    }
  });

  afterAll(async () => {
    await module.close();
  });
});
