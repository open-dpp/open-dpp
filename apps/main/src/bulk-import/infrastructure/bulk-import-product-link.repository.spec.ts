import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { BulkImportProductLink } from "../domain/bulk-import-product-link";
import { BulkImportProductLinkRepository } from "./bulk-import-product-link.repository";
import { BulkImportProductLinkDoc, BulkImportProductLinkSchema } from "./bulk-import-product-link.schema";

describe("bulkImportProductLinkRepository", () => {
  let repository: BulkImportProductLinkRepository;
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
          { name: BulkImportProductLinkDoc.name, schema: BulkImportProductLinkSchema },
        ]),
      ],
      providers: [BulkImportProductLinkRepository],
    }).compile();
    await module.init();

    repository = module.get<BulkImportProductLinkRepository>(BulkImportProductLinkRepository);
  });

  it("saves a link and finds it by organization/template/externalId", async () => {
    const organizationId = randomUUID();
    const templateId = randomUUID();
    const link = BulkImportProductLink.create({
      organizationId,
      templateId,
      externalId: "4711",
      passportId: randomUUID(),
    });
    await repository.save(link);

    const found = await repository.findOne(organizationId, templateId, "4711");
    expect(found).toEqual(link);
  });

  it("returns undefined when no link matches", async () => {
    expect(await repository.findOne(randomUUID(), randomUUID(), "does-not-exist")).toBeUndefined();
  });

  it("rejects a second link for the same organization/template/externalId", async () => {
    const organizationId = randomUUID();
    const templateId = randomUUID();
    const first = BulkImportProductLink.create({
      organizationId,
      templateId,
      externalId: "4711",
      passportId: randomUUID(),
    });
    const second = BulkImportProductLink.create({
      organizationId,
      templateId,
      externalId: "4711",
      passportId: randomUUID(),
    });
    await repository.save(first);
    await expect(repository.save(second)).rejects.toBeDefined();
  });

  it("deletes all links of a template", async () => {
    const templateId = randomUUID();
    const link = BulkImportProductLink.create({
      organizationId: randomUUID(),
      templateId,
      externalId: "4711",
      passportId: randomUUID(),
    });
    await repository.save(link);
    await repository.deleteAllByTemplateId(templateId);
    expect(await repository.findOne(link.organizationId, templateId, "4711")).toBeUndefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
