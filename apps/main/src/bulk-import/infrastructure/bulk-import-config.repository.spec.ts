import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { BulkImportConfig } from "../domain/bulk-import-config";
import { FieldMapping } from "../domain/field-mapping";
import { JsonTransformer } from "../domain/json-transformer";
import { BulkImportConfigRepository } from "./bulk-import-config.repository";
import { BulkImportConfigDoc, BulkImportConfigSchema } from "./bulk-import-config.schema";

describe("bulkImportConfigRepository", () => {
  let repository: BulkImportConfigRepository;
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
        MongooseModule.forFeature([{ name: BulkImportConfigDoc.name, schema: BulkImportConfigSchema }]),
      ],
      providers: [BulkImportConfigRepository],
    }).compile();
    await module.init();

    repository = module.get<BulkImportConfigRepository>(BulkImportConfigRepository);
  });

  function buildConfig(data: { organizationId?: string; templateId?: string } = {}) {
    return BulkImportConfig.create({
      organizationId: data.organizationId ?? randomUUID(),
      templateId: data.templateId ?? randomUUID(),
      name: "ERP export",
      idField: "sku",
      submodelMappings: new Map([
        [
          randomUUID(),
          JsonTransformer.create({
            fieldMappings: [FieldMapping.create({ input: "weightKg", output: "weight" })],
          }),
        ],
      ]),
    });
  }

  it("saves and finds a config", async () => {
    const config = buildConfig();
    await repository.save(config);
    const found = await repository.findOneOrFail(config.id);
    expect(found).toEqual(config);
  });

  it("returns undefined for a missing config", async () => {
    expect(await repository.findOne(randomUUID())).toBeUndefined();
  });

  it("finds all configs of an organization, optionally filtered by template", async () => {
    const organizationId = randomUUID();
    const templateId = randomUUID();
    const c1 = buildConfig({ organizationId, templateId });
    const c2 = buildConfig({ organizationId });
    const c3 = buildConfig();

    await repository.save(c1);
    await repository.save(c2);
    await repository.save(c3);

    const all = await repository.findAllByOrganizationId(organizationId);
    expect(all.map((c) => c.id).sort()).toEqual([c1.id, c2.id].sort());

    const filtered = await repository.findAllByOrganizationId(organizationId, { templateId });
    expect(filtered.map((c) => c.id)).toEqual([c1.id]);
  });

  it("deletes all configs of a template", async () => {
    const templateId = randomUUID();
    const config = buildConfig({ templateId });
    await repository.save(config);
    await repository.deleteAllByTemplateId(templateId);
    expect(await repository.findOne(config.id)).toBeUndefined();
  });

  it("finds all configs of a template regardless of organization filter", async () => {
    const templateId = randomUUID();
    const config = buildConfig({ templateId });
    const other = buildConfig();
    await repository.save(config);
    await repository.save(other);

    const found = await repository.findAllByTemplateId(templateId);
    expect(found.map((c) => c.id)).toEqual([config.id]);
  });

  it("deletes a single config by id", async () => {
    const config = buildConfig();
    await repository.save(config);
    await repository.deleteById(config.id);
    expect(await repository.findOne(config.id)).toBeUndefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
