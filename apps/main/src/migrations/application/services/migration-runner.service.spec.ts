import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Logger } from "@nestjs/common";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { ValueError } from "@open-dpp/exception";
import { Model } from "mongoose";
import { generateMongoConfig } from "../../../database/config";
import { Migration } from "../../domain/migration";
import { AppliedMigrationRepository } from "../../infrastructure/applied-migration.repository";
import {
  AppliedMigrationDoc,
  AppliedMigrationSchema,
} from "../../infrastructure/applied-migration.schema";
import { MIGRATIONS, MigrationRunnerService } from "./migration-runner.service";

describe("MigrationRunnerService", () => {
  let module: TestingModule;
  let repository: AppliedMigrationRepository;
  let appliedMigrationModel: Model<AppliedMigrationDoc>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  const migrations: Migration[] = [];
  const executed: string[] = [];

  const migration = (id: string, up?: () => Promise<void>): Migration => ({
    id,
    up:
      up ??
      (async () => {
        executed.push(id);
      }),
  });

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          { name: AppliedMigrationDoc.name, schema: AppliedMigrationSchema },
        ]),
      ],
      providers: [AppliedMigrationRepository],
    }).compile();

    repository = module.get(AppliedMigrationRepository);
    appliedMigrationModel = module.get(getModelToken(AppliedMigrationDoc.name));
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await appliedMigrationModel.deleteMany({});
    migrations.length = 0;
    executed.length = 0;
    errorSpy = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    warnSpy = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  const runner = () => new MigrationRunnerService(migrations, repository);

  it("applies pending migrations in id order and records them", async () => {
    migrations.push(
      migration("20260102000000-second"),
      migration("20260101000000-first"),
      migration("20260103000000-third"),
    );

    const applied = await runner().runPending();

    const expectedOrder = ["20260101000000-first", "20260102000000-second", "20260103000000-third"];
    expect(applied).toEqual(expectedOrder);
    expect(executed).toEqual(expectedOrder);
    expect((await repository.findAllIds()).sort()).toEqual(expectedOrder);
    const record = await appliedMigrationModel.findById("20260101000000-first").lean();
    expect(record).toEqual({ _id: "20260101000000-first", appliedAt: expect.any(Date) });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does not apply a migration twice", async () => {
    migrations.push(migration("20260101000000-first"));
    await runner().runPending();
    migrations.push(migration("20260102000000-second"));

    const applied = await runner().runPending();

    expect(applied).toEqual(["20260102000000-second"]);
    expect(executed).toEqual(["20260101000000-first", "20260102000000-second"]);
  });

  it("applies nothing when every migration has been applied", async () => {
    migrations.push(migration("20260101000000-first"));
    await runner().runPending();

    expect(await runner().runPending()).toEqual([]);
    expect(executed).toEqual(["20260101000000-first"]);
  });

  it("stops at a failing migration, rethrows and retries it on the next run", async () => {
    const failure = new Error("boom");
    const failing = vi.fn<() => Promise<void>>().mockRejectedValueOnce(failure);
    migrations.push(
      migration("20260101000000-first"),
      migration("20260102000000-failing", failing),
      migration("20260103000000-third"),
    );

    await expect(runner().runPending()).rejects.toBe(failure);

    expect(executed).toEqual(["20260101000000-first"]);
    expect(await repository.findAllIds()).toEqual(["20260101000000-first"]);
    expect(errorSpy).toHaveBeenCalledTimes(1);

    failing.mockResolvedValue(undefined);
    expect(await runner().runPending()).toEqual(["20260102000000-failing", "20260103000000-third"]);
  });

  it("warns about applied migrations unknown to this version and still runs the pending ones", async () => {
    migrations.push(migration("20260101000000-first"));
    await runner().runPending();
    migrations.length = 0;
    migrations.push(migration("20260102000000-second"));

    expect(await runner().runPending()).toEqual(["20260102000000-second"]);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("20260101000000-first"));
  });

  it("warns about pending migrations older than an applied one and still runs them", async () => {
    migrations.push(migration("20260102000000-second"));
    await runner().runPending();
    migrations.push(migration("20260101000000-merged-late"));

    expect(await runner().runPending()).toEqual(["20260101000000-merged-late"]);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("20260101000000-merged-late"));
  });

  it("runs on application bootstrap", async () => {
    migrations.push(migration("20260101000000-first"));

    await runner().onApplicationBootstrap();

    expect(executed).toEqual(["20260101000000-first"]);
  });

  it.each([
    "first",
    "2026010100000-too-short",
    "20260101000000_snake_case",
    "20260101000000-Upper",
  ])("rejects the malformed id %s before running anything", async (id) => {
    migrations.push(migration("20260101000000-first"), migration(id));

    await expect(runner().runPending()).rejects.toThrow(ValueError);
    expect(executed).toEqual([]);
  });

  it("rejects duplicate ids before running anything", async () => {
    migrations.push(migration("20260101000000-first"), migration("20260101000000-first"));

    await expect(runner().runPending()).rejects.toThrow(ValueError);
    expect(executed).toEqual([]);
  });

  it("is provided with every registered migration by the MIGRATIONS token", async () => {
    const registered = migration("20260101000000-registered");
    const testingModule = await Test.createTestingModule({
      providers: [
        MigrationRunnerService,
        { provide: MIGRATIONS, useValue: [registered] },
        { provide: AppliedMigrationRepository, useValue: repository },
      ],
    }).compile();

    expect(await testingModule.get(MigrationRunnerService).runPending()).toEqual([
      "20260101000000-registered",
    ]);
    await testingModule.close();
  });
});
