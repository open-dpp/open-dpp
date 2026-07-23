import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { encodeCursor, Pagination } from "../../pagination/pagination";
import { BulkImportRun } from "../domain/bulk-import-run";
import { BulkImportRunRepository } from "./bulk-import-run.repository";
import { BulkImportRunDoc, BulkImportRunSchema } from "./bulk-import-run.schema";

describe("bulkImportRunRepository", () => {
  let repository: BulkImportRunRepository;
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
        MongooseModule.forFeature([{ name: BulkImportRunDoc.name, schema: BulkImportRunSchema }]),
      ],
      providers: [BulkImportRunRepository],
    }).compile();
    await module.init();

    repository = module.get<BulkImportRunRepository>(BulkImportRunRepository);
  });

  function buildRun(data: { bulkImportConfigId?: string; createdAt?: Date } = {}) {
    return BulkImportRun.create({
      bulkImportConfigId: data.bulkImportConfigId ?? randomUUID(),
      organizationId: randomUUID(),
      subject: SubjectAttributes.create({ userRole: UserRole.USER }),
      userId: randomUUID(),
      totalCount: 3,
      createdAt: data.createdAt,
    });
  }

  it("saves and finds a run, preserving progress", async () => {
    const run = buildRun();
    run.start();
    run.recordItemOutcome(true);
    run.recordItemOutcome(false);
    await repository.save(run);

    const found = await repository.findOneOrFail(run.id);
    expect(found).toEqual(run);
  });

  it("paginates runs of a config, newest first", async () => {
    const bulkImportConfigId = randomUUID();
    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const date3 = new Date("2022-03-01T00:00:00.000Z");

    const r1 = buildRun({ bulkImportConfigId, createdAt: date1 });
    const r2 = buildRun({ bulkImportConfigId, createdAt: date2 });
    const r3 = buildRun({ bulkImportConfigId, createdAt: date3 });
    const otherConfigRun = buildRun({ createdAt: date3 });

    await repository.save(r1);
    await repository.save(r2);
    await repository.save(r3);
    await repository.save(otherConfigRun);

    const page = await repository.findAllByBulkImportConfigId(
      bulkImportConfigId,
      Pagination.create({ limit: 2 }),
    );
    expect(page.items.map((r) => r.id)).toEqual([r3.id, r2.id]);
    expect(page.pagination.cursor).toEqual(encodeCursor(r2.createdAt.toISOString(), r2.id));

    const nextPage = await repository.findAllByBulkImportConfigId(bulkImportConfigId, page.pagination);
    expect(nextPage.items.map((r) => r.id)).toEqual([r1.id]);
  });

  it("finds runs still pending or running", async () => {
    const running = buildRun();
    running.start();
    const pending = buildRun();
    const completed = buildRun();
    completed.start();
    completed.complete();

    await repository.save(running);
    await repository.save(pending);
    await repository.save(completed);

    const stillRunning = await repository.findAllRunning();
    const stillRunningIds = stillRunning.map((r) => r.id);
    expect(stillRunningIds).toEqual(expect.arrayContaining([running.id, pending.id]));
    expect(stillRunningIds).not.toContain(completed.id);
  });

  afterAll(async () => {
    await module.close();
  });
});
