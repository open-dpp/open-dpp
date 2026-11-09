import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConfigService } from "@nestjs/config";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Model } from "mongoose";
import { generateMongoConfig } from "../../../database/config";
import { DatabaseModule } from "../../../database/database.module";
import { TransactionService } from "../../../database/transaction.service";
import { InstanceSettings } from "../../domain/instance-settings";
import { InstanceSettingsRepository } from "../../infrastructure/adapters/instance-settings.repository";
import {
  InstanceSettingsDocument,
  InstanceSettingsMongooseSchema,
  InstanceSettingsSchema,
} from "../../infrastructure/schemas/instance-settings.schema";
import { InstanceSettingsService } from "./instance-settings.service";

describe("InstanceSettingsService across replicas", () => {
  // mailEnabled is only editable with an SMTP host, and no setting may be env-locked
  const envWithSmtpHost = new EnvService({
    get: (key: string) => (key === "OPEN_DPP_MAIL_HOST" ? "smtp.example.com" : undefined),
  } as unknown as ConfigService);

  let module: TestingModule;
  let model: Model<InstanceSettingsDocument>;
  let repository: InstanceSettingsRepository;
  let transactionService: TransactionService;

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
          { name: InstanceSettingsSchema.name, schema: InstanceSettingsMongooseSchema },
        ]),
        DatabaseModule,
      ],
      providers: [InstanceSettingsRepository],
    }).compile();

    model = module.get<Model<InstanceSettingsDocument>>(getModelToken(InstanceSettingsSchema.name));
    repository = module.get(InstanceSettingsRepository);
    transactionService = module.get(TransactionService);
  });

  beforeEach(async () => {
    await model.deleteMany({});
  });

  afterAll(async () => {
    await module.close();
  });

  /** A service instance has its own queue and cache, so only the DB is shared, as on replicas. */
  const newReplica = (replicaRepository: InstanceSettingsRepository = repository) =>
    new InstanceSettingsService(replicaRepository, envWithSmtpHost, transactionService);

  /** A repository that stops its first save() after the read, until `resumeSave` is called. */
  function repositoryPausedBeforeFirstSave() {
    const paused = new InstanceSettingsRepository(model);
    const originalSave = paused.save.bind(paused);
    let resumeSave!: () => void;
    const resumed = new Promise<void>((resolve) => (resumeSave = resolve));
    let markReachedSave!: () => void;
    const reachedSave = new Promise<void>((resolve) => (markReachedSave = resolve));
    vi.spyOn(paused, "save").mockImplementationOnce(async (...args) => {
      markReachedSave();
      await resumed;
      return originalSave(...args);
    });
    return { paused, reachedSave, resumeSave };
  }

  it("keeps a change another replica committed between this replica's read and save", async () => {
    await repository.save(InstanceSettings.create());
    const { paused, reachedSave, resumeSave } = repositoryPausedBeforeFirstSave();

    const slowUpdate = newReplica(paused).updateSettings({ signupEnabled: false });
    await reachedSave;
    await newReplica().updateSettings({ mailEnabled: false });
    resumeSave();
    const result = await slowUpdate;

    const stored = await repository.findOne();
    expect(stored?.mailEnabled.value).toBe(false);
    expect(stored?.signupEnabled.value).toBe(false);
    expect(result.mailEnabled.value).toBe(false);
    expect(result.signupEnabled.value).toBe(false);
  });

  it("applies simultaneous updates from every replica", async () => {
    await repository.save(InstanceSettings.create());

    await Promise.all([
      newReplica().updateSettings({ signupEnabled: false }),
      newReplica().updateSettings({ organizationCreationEnabled: false }),
      newReplica().updateSettings({ mailEnabled: false }),
      newReplica().updateSettings({ permalinkBaseUrl: "https://id.acme.com" }),
    ]);

    const stored = await repository.findOne();
    expect(stored?.toPlain()).toMatchObject({
      signupEnabled: false,
      organizationCreationEnabled: false,
      mailEnabled: false,
      permalinkBaseUrl: "https://id.acme.com",
    });
  });

  it("creates the settings on an update when the collection does not exist yet", async () => {
    // production sets autoCreate: false, so a fresh install has no collection
    await model.collection.drop();

    const result = await newReplica().updateSettings({ signupEnabled: false });

    expect(result.signupEnabled.value).toBe(false);
    expect((await repository.findOne())?.signupEnabled.value).toBe(false);
  });
});
