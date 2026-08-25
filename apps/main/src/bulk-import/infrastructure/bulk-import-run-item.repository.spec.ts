import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { encodeRowIndexCursor, Pagination } from "../../pagination/pagination";
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
        MongooseModule.forFeature([
          { name: BulkImportRunItemDoc.name, schema: BulkImportRunItemSchema },
        ]),
      ],
      providers: [BulkImportRunItemRepository],
    }).compile();
    await module.init();

    repository = module.get<BulkImportRunItemRepository>(BulkImportRunItemRepository);
  });

  it("creates many items for a run in one call and lists them sorted by rowIndex", async () => {
    const runId = randomUUID();
    const item0 = BulkImportRunItem.create({
      runId,
      rowIndex: 0,
      inputData: { sku: "1" },
      externalId: "1",
    });
    const item1 = BulkImportRunItem.create({
      runId,
      rowIndex: 1,
      inputData: { sku: "2" },
      externalId: "2",
    });

    await repository.createMany([item1, item0]);

    const result = await repository.findAllByRunId(runId);
    expect(result.items.map((i: any) => i.id)).toEqual([item0.id, item1.id]);
  });

  it("does nothing when creating an empty list of items", async () => {
    await expect(repository.createMany([])).resolves.toBeUndefined();
  });

  it("saves an item's updated status", async () => {
    const item = BulkImportRunItem.create({
      runId: randomUUID(),
      rowIndex: 0,
      inputData: { sku: "1" },
      externalId: "1",
    });
    await repository.createMany([item]);

    item.markCreated(randomUUID());
    await repository.save(item);

    const found = await repository.findOneOrFail(item.id);
    expect(found).toEqual(item);
  });

  it("deletes all items of the given runs", async () => {
    const runId1 = randomUUID();
    const runId2 = randomUUID();
    const otherRunId = randomUUID();
    // deliberately empty inputData: Mongoose drops empty-object Mixed fields to undefined on read,
    // exercising the default({}) fallback in BulkImportRunItemSchema.
    const item1 = BulkImportRunItem.create({
      runId: runId1,
      rowIndex: 0,
      inputData: {},
      externalId: null,
    });
    const item2 = BulkImportRunItem.create({
      runId: runId2,
      rowIndex: 0,
      inputData: {},
      externalId: null,
    });
    const otherItem = BulkImportRunItem.create({
      runId: otherRunId,
      rowIndex: 0,
      inputData: {},
      externalId: null,
    });
    await repository.createMany([item1, item2, otherItem]);

    await repository.deleteAllByRunIds([runId1, runId2]);

    expect((await repository.findAllByRunId(runId1)).items).toEqual([]);
    expect((await repository.findAllByRunId(runId2)).items).toEqual([]);
    expect((await repository.findAllByRunId(otherRunId)).items).toHaveLength(1);
  });

  it("does nothing when deleting an empty list of runs", async () => {
    await expect(repository.deleteAllByRunIds([])).resolves.toBeUndefined();
  });

  describe("pagination", () => {
    it("returns paginated results with cursor", async () => {
      const runId = randomUUID();
      const items = [
        BulkImportRunItem.create({ runId, rowIndex: 0, inputData: { sku: "0" }, externalId: "0" }),
        BulkImportRunItem.create({ runId, rowIndex: 1, inputData: { sku: "1" }, externalId: "1" }),
        BulkImportRunItem.create({ runId, rowIndex: 2, inputData: { sku: "2" }, externalId: "2" }),
      ];
      await repository.createMany(items);

      const page1 = await repository.findAllByRunId(runId, Pagination.create({ limit: 2 }));
      expect(page1.items).toHaveLength(2);
      expect(page1.items[0].rowIndex).toBe(0);
      expect(page1.items[1].rowIndex).toBe(1);
      expect(page1.pagination.cursor).toBe(encodeRowIndexCursor(1, items[1].id));

      const page2 = await repository.findAllByRunId(runId, page1.pagination);
      expect(page2.items).toHaveLength(1);
      expect(page2.items[0].rowIndex).toBe(2);
      const lastItem = items[2];
      expect(page2.pagination.cursor).toEqual(encodeRowIndexCursor(lastItem.rowIndex, lastItem.id));
    });

    it("returns all items when no pagination is provided", async () => {
      const runId = randomUUID();
      const items = [
        BulkImportRunItem.create({ runId, rowIndex: 0, inputData: { sku: "0" }, externalId: "0" }),
        BulkImportRunItem.create({ runId, rowIndex: 1, inputData: { sku: "1" }, externalId: "1" }),
        BulkImportRunItem.create({ runId, rowIndex: 2, inputData: { sku: "2" }, externalId: "2" }),
      ];
      await repository.createMany(items);

      const result = await repository.findAllByRunId(runId);
      expect(result.items).toHaveLength(3);
      const lastItem = items[2];

      expect(result.pagination.cursor).toBe(encodeRowIndexCursor(lastItem.rowIndex, lastItem.id));
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
