import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { generateMongoConfig } from "../../../database/config";
import { AiConfiguration } from "../domain/ai-configuration";
import { aiConfigurationFactory } from "../fixtures/ai-configuration-props.factory";
import {
  AiConfigurationDbSchema,
  AiConfigurationDoc,
} from "./ai-configuration.schema";
import { AiConfigurationService } from "./ai-configuration.service";

describe("aiConfigurationService", () => {
  let service: AiConfigurationService;
  let module: TestingModule;

  const mockNow = new Date("2025-01-01T12:00:00Z").getTime();

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
            name: AiConfigurationDoc.name,
            schema: AiConfigurationDbSchema,
          },
        ]),
      ],
      providers: [AiConfigurationService],
    }).compile();
    service = module.get<AiConfigurationService>(AiConfigurationService);
  });
  beforeEach(() => {
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fails if requested configuration could not be found", async () => {
    await expect(service.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(AiConfiguration.name),
    );
  });

  it("should save configuration", async () => {
    const aiConfiguration = AiConfiguration.loadFromDb(
      aiConfigurationFactory.build(),
    );

    const { id } = await service.save(aiConfiguration);
    const found = await service.findOneOrFail(id);
    expect(found).toEqual(aiConfiguration);
  });

  it("should find configuration by organization id", async () => {
    const orgaId = randomUUID();
    const aiConfiguration = AiConfiguration.loadFromDb(
      aiConfigurationFactory.build({ ownedByOrganizationId: orgaId }),
    );
    await service.save(aiConfiguration);
    const found = await service.findOneByOrganizationId(orgaId);
    expect(found).toEqual(aiConfiguration);
  });

  afterAll(async () => {
    await module.close();
  });
});
