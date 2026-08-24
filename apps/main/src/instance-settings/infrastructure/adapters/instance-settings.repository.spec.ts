import { describe, expect, it } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../../database/config";
import { InstanceSettings } from "../../domain/instance-settings";
import {
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
});
