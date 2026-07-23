import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { BulkImportRunItem } from "../domain/bulk-import-run-item";
import { BulkImportRunItemRepository } from "./bulk-import-run-item.repository";
import { BulkImportRunItemDoc, BulkImportRunItemSchema } from "./bulk-import-run-item.schema";

describe("bulkImportRunItemRepository", () => {
  let repository: BulkImportRunItemRepository;
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
        MongooseModule.forFeature([{ name: BulkImportRunItemDoc.name, schema: BulkImportRunItemSchema }]),
      ],
      providers: [BulkImportRunItemRepository],
    }).compile();
    await module.init();

    repository = module.get<BulkImportRunItemRepository>(BulkImportRunItemRepository);
  });

  it("creates many items for a run in one call and lists them sorted by rowIndex", async () => {
    const runId = randomUUID();
    const item0 = BulkImportRunItem.create({ runId, rowIndex: 0, inputData: { sku: "1" } });
    const item1 = BulkImportRunItem.create({ runId, rowIndex: 1, inputData: { sku: "2" } });

    await repository.createMany([item1, item0]);

    const found = await repository.findAllByRunId(runId);
    expect(found.map((i) => i.id)).toEqual([item0.id, item1.id]);
  });

  it("does nothing when creating an empty list of items", async () => {
    await expect(repository.createMany([])).resolves.toBeUndefined();
  });

  it("saves an item's updated status", async () => {
    const item = BulkImportRunItem.create({
      runId: randomUUID(),
      rowIndex: 0,
      inputData: { sku: "1" },
    });
    await repository.createMany([item]);

    item.markCreated(randomUUID());
    await repository.save(item);

    const found = await repository.findOneOrFail(item.id);
    expect(found).toEqual(item);
  });

  afterAll(async () => {
    await module.close();
  });
});
