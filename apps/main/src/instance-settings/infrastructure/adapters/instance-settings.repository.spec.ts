import { describe, expect, it } from "@jest/globals";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Model } from "mongoose";
import { generateMongoConfig } from "../../../database/config";
import { InstanceSettings } from "../../domain/instance-settings";
import {
  InstanceSettingsDocument,
  InstanceSettingsDocVersion,
  InstanceSettingsMongooseSchema,
  InstanceSettingsSchema,
} from "../schemas/instance-settings.schema";
import { InstanceSettingsRepository } from "./instance-settings.repository";

describe("InstanceSettingsRepository", () => {
  let repository: InstanceSettingsRepository;
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
          { name: InstanceSettingsSchema.name, schema: InstanceSettingsMongooseSchema },
        ]),
      ],
      providers: [InstanceSettingsRepository],
    }).compile();

    repository = module.get<InstanceSettingsRepository>(InstanceSettingsRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  it("round-trips the permalinkBaseUrl through MongoDB", async () => {
    const settings = InstanceSettings.create({
      permalinkBaseUrl: { value: "https://id.acme.com" },
    });

    await repository.save(settings);
    const found = await repository.findOne();

    expect(found).not.toBeNull();
    expect(found!.permalinkBaseUrl.value).toBe("https://id.acme.com");
  });

  it("round-trips mailEnabled=false through MongoDB", async () => {
    // settings are a singleton: update the document the previous test created
    const existing = (await repository.findOne()) ?? InstanceSettings.create();

    await repository.save(existing.update({ mailEnabled: false }));
    const found = await repository.findOne();

    expect(found!.mailEnabled.value).toBe(false);
  });

  it("persists documents with schema version 1.4.0", async () => {
    await repository.save(InstanceSettings.create());
    const model = module.get<Model<InstanceSettingsDocument>>(
      getModelToken(InstanceSettingsSchema.name),
    );

    const raw = await model.findOne().lean();

    expect(raw?._schemaVersion).toBe(InstanceSettingsDocVersion.v1_4_0);
  });
});
