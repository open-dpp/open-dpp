import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
import {
  ApiVersionsDto,
  type ApiVersionsDtoType,
  BulkImportRunStatusDto,
  type BulkImportRunStatusDtoType,
  type ValueRequestDto,
} from "@open-dpp/dto";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { DbSessionOptions } from "../../../database/query-options";
import { Pagination } from "../../../pagination/pagination";
import { PagingResult } from "../../../pagination/paging-result";
import { Passport } from "../../../passports/domain/passport";
import { BulkImportConfig } from "../../domain/bulk-import-config";
import { FieldMapping } from "../../domain/field-mapping";
import { JsonTransformer } from "../../domain/json-transformer";
import { BulkImportProductLink } from "../../domain/bulk-import-product-link";
import { BulkImportRun } from "../../domain/bulk-import-run";
import { BulkImportRunItem } from "../../domain/bulk-import-run-item";
import { BulkImportRunService } from "./bulk-import-run.service";
import { NotFoundError } from "@open-dpp/exception";
import { UserContext } from "../../../aas/presentation/environment.service";

describe("BulkImportRunService", () => {
  const submodelIdShort = "Nameplate";

  function buildConfig() {
    return BulkImportConfig.create({
      organizationId: randomUUID(),
      templateId: randomUUID(),
      name: "ERP export",
      idField: "sku",
      submodelMappings: new Map([
        [
          submodelIdShort,
          JsonTransformer.create({
            fieldMappings: [FieldMapping.create({ input: "weightKg", output: "weight" })],
          }),
        ],
      ]),
    });
  }

  function buildFakes() {
    const configRepository = {
      findOneOrFail: jest.fn<(id: string) => Promise<BulkImportConfig>>(),
    };
    const runRepository = {
      save: jest.fn<(run: BulkImportRun) => Promise<BulkImportRun>>(),
      findOneOrFail: jest.fn<(id: string) => Promise<BulkImportRun>>(),
      findAllRunning: jest.fn<() => Promise<BulkImportRun[]>>(),
      findAllByBulkImportConfigId:
        jest.fn<
          (
            bulkImportConfigId: string,
            options?: { pagination?: Pagination; filter?: { status?: BulkImportRunStatusDtoType[] } },
          ) => Promise<PagingResult<BulkImportRun>>
        >(),
    };
    const runItemRepository = {
      createMany:
        jest.fn<(items: BulkImportRunItem[], options?: DbSessionOptions) => Promise<void>>(),
      findAllByRunId: jest.fn<(id: string) => Promise<BulkImportRunItem[]>>(),
      save: jest.fn<(item: BulkImportRunItem, options?: DbSessionOptions) => Promise<void>>(),
    };
    const productLinkRepository = {
      findOne:
        jest.fn<
          (
            organizationId: string,
            templateId: string,
            externalId: string,
          ) => Promise<BulkImportProductLink | undefined>
        >(),
      save: jest.fn<
        (link: BulkImportProductLink, options?: DbSessionOptions) => Promise<BulkImportProductLink>
      >(),
    };
    const passportService = {
      createPassportFromTemplate:
        jest.fn<
          (
            organizationId: string,
            templateId: string,
            subject: SubjectAttributes,
            options?: DbSessionOptions,
          ) => Promise<Passport>
        >(),
      digitalProductDocumentService: {
        modifyValueOfMultipleSubmodels:
          jest.fn<
            (
              correlationId: string,
              organizationId: string,
              id: string,
              body: Record<string, ValueRequestDto>,
              userContext: UserContext,
              version: ApiVersionsDtoType,
            ) => Promise<void>
          >(),
      },
    };
    // No real Mongo session in these unit tests; just run the work directly.
    const transactionService = {
      withTransaction: jest.fn<<T>(work: (options: DbSessionOptions) => Promise<T>) => Promise<T>>(
        async (work) => await work({}),
      ),
    };

    const service = new BulkImportRunService(
      runRepository as any,
      runItemRepository as any,
      configRepository as any,
      productLinkRepository as any,
      passportService as any,
      transactionService as any,
    );

    return {
      service,
      configRepository,
      runRepository,
      runItemRepository,
      productLinkRepository,
      passportService,
      transactionService,
    };
  }

  it("createRun persists a pending run and its items, and returns immediately", async () => {
    const { service, runRepository, runItemRepository, configRepository } = buildFakes();
    const config = buildConfig();
    const subject = SubjectAttributes.create({ userRole: UserRole.USER });
    const rows = [
      { sku: "1", weightKg: 1 },
      { sku: "2", weightKg: 2 },
    ];

    // The fire-and-forget processRun() will still run in the background; wire it to resolve quietly
    // instead of hitting unmocked collaborators, since save() happens before processRun() starts.
    const savedRuns = new Map<string, BulkImportRun>();
    runRepository.save.mockImplementation(async (run: BulkImportRun) => {
      savedRuns.set(run.id, run);
      return run;
    });
    runRepository.findOneOrFail.mockImplementation(async (id: string) => savedRuns.get(id)!);
    configRepository.findOneOrFail.mockResolvedValue(config);
    runItemRepository.findAllByRunId.mockResolvedValue([]);

    const run = await service.createRun(config, rows, subject, randomUUID());

    expect(run.status).toEqual(BulkImportRunStatusDto.Pending);
    expect(run.totalCount).toEqual(2);
    expect(runRepository.save).toHaveBeenCalledWith(run);
    expect(runItemRepository.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ rowIndex: 0, inputData: rows[0] }),
        expect.objectContaining({ rowIndex: 1, inputData: rows[1] }),
      ]),
    );
  });

  it("processRun creates a new passport and product link atomically when no link exists yet", async () => {
    const {
      service,
      configRepository,
      runRepository,
      runItemRepository,
      productLinkRepository,
      passportService,
      transactionService,
    } = buildFakes();
    const config = buildConfig();
    const run = BulkImportRun.create({
      bulkImportConfigId: config.id,
      organizationId: config.organizationId,
      subject: SubjectAttributes.create({ userRole: UserRole.USER }),
      userId: randomUUID(),
      totalCount: 1,
    });
    const item = BulkImportRunItem.create({
      runId: run.id,
      rowIndex: 0,
      inputData: { sku: "4711", weightKg: 12 },
    });

    configRepository.findOneOrFail.mockResolvedValue(config);
    runRepository.findOneOrFail.mockResolvedValue(run);
    runItemRepository.findAllByRunId.mockResolvedValue([item]);
    productLinkRepository.findOne.mockResolvedValue(undefined);
    passportService.createPassportFromTemplate.mockResolvedValue({
      id: "passport-1",
    } as Passport);

    await (service as any).processRun(run.id);

    expect(transactionService.withTransaction).toHaveBeenCalledTimes(1);
    expect(passportService.createPassportFromTemplate).toHaveBeenCalledWith(
      run.organizationId,
      config.templateId,
      run.subject,
      {},
    );
    expect(productLinkRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: run.organizationId,
        templateId: config.templateId,
        externalId: "4711",
        passportId: "passport-1",
      }),
      {},
    );
    const expectedValueRequest: Record<string, ValueRequestDto> = {
      [submodelIdShort]: { weight: 12 },
    };
    // @ts-ignore
    expect(
      passportService.digitalProductDocumentService.modifyValueOfMultipleSubmodels,
    ).toHaveBeenCalledWith(
      run.id,
      run.organizationId,
      "passport-1",
      expectedValueRequest,
      { subject: run.subject, userId: run.userId },
      ApiVersionsDto.v2,
    );
    expect(item.status).toEqual("created");
    expect(item.passportId).toEqual("passport-1");
    expect(run.status).toEqual(BulkImportRunStatusDto.Completed);
    expect(run.succeededCount).toEqual(1);
  });

  it("processRun updates the existing passport when a link already matches", async () => {
    const {
      service,
      configRepository,
      runRepository,
      runItemRepository,
      productLinkRepository,
      passportService,
    } = buildFakes();
    const config = buildConfig();
    const run = BulkImportRun.create({
      bulkImportConfigId: config.id,
      organizationId: config.organizationId,
      subject: SubjectAttributes.create({ userRole: UserRole.USER }),
      userId: randomUUID(),
      totalCount: 1,
    });
    const item = BulkImportRunItem.create({
      runId: run.id,
      rowIndex: 0,
      inputData: { sku: "4711", weightKg: 12 },
    });
    const existingLink = BulkImportProductLink.create({
      organizationId: run.organizationId,
      templateId: config.templateId,
      externalId: "4711",
      passportId: "existing-passport",
    });

    configRepository.findOneOrFail.mockResolvedValue(config);
    runRepository.findOneOrFail.mockResolvedValue(run);
    runItemRepository.findAllByRunId.mockResolvedValue([item]);
    productLinkRepository.findOne.mockResolvedValue(existingLink);

    await (service as any).processRun(run.id);

    expect(passportService.createPassportFromTemplate).not.toHaveBeenCalled();
    expect(productLinkRepository.save).not.toHaveBeenCalled();
    expect(item.status).toEqual("updated");
    expect(item.passportId).toEqual("existing-passport");
    expect(run.status).toEqual(BulkImportRunStatusDto.Completed);
  });

  it("marks a row failed when the id field is missing, without stopping other rows", async () => {
    const {
      service,
      configRepository,
      runRepository,
      runItemRepository,
      productLinkRepository,
      passportService,
    } = buildFakes();
    const config = buildConfig();
    const run = BulkImportRun.create({
      bulkImportConfigId: config.id,
      organizationId: config.organizationId,
      subject: SubjectAttributes.create({ userRole: UserRole.USER }),
      userId: randomUUID(),
      totalCount: 2,
    });
    const missingIdItem = BulkImportRunItem.create({
      runId: run.id,
      rowIndex: 0,
      inputData: { weightKg: 12 },
    });
    const okItem = BulkImportRunItem.create({
      runId: run.id,
      rowIndex: 1,
      inputData: { sku: "4711", weightKg: 12 },
    });

    configRepository.findOneOrFail.mockResolvedValue(config);
    runRepository.findOneOrFail.mockResolvedValue(run);
    runItemRepository.findAllByRunId.mockResolvedValue([missingIdItem, okItem]);
    productLinkRepository.findOne.mockResolvedValue(undefined);
    passportService.createPassportFromTemplate.mockResolvedValue({ id: "passport-1" } as Passport);

    await (service as any).processRun(run.id);

    expect(missingIdItem.status).toEqual("failed");
    expect(missingIdItem.error).toContain("sku");
    expect(okItem.status).toEqual("created");
    expect(run.succeededCount).toEqual(1);
    expect(run.failedCount).toEqual(1);
    expect(run.status).toEqual(BulkImportRunStatusDto.CompletedWithErrors);
  });

  it("marks a row failed when the passport has no submodel matching the mapping's idShort", async () => {
    const {
      service,
      configRepository,
      runRepository,
      runItemRepository,
      productLinkRepository,
      passportService,
    } = buildFakes();
    const config = buildConfig();
    const run = BulkImportRun.create({
      bulkImportConfigId: config.id,
      organizationId: config.organizationId,
      subject: SubjectAttributes.create({ userRole: UserRole.USER }),
      userId: randomUUID(),
      totalCount: 1,
    });
    const item = BulkImportRunItem.create({
      runId: run.id,
      rowIndex: 0,
      inputData: { sku: "4711", weightKg: 12 },
    });

    configRepository.findOneOrFail.mockResolvedValue(config);
    runRepository.findOneOrFail.mockResolvedValue(run);
    runItemRepository.findAllByRunId.mockResolvedValue([item]);
    productLinkRepository.findOne.mockResolvedValue(undefined);
    passportService.createPassportFromTemplate.mockResolvedValue({ id: "passport-1" } as Passport);
    passportService.digitalProductDocumentService.modifyValueOfMultipleSubmodels.mockRejectedValue(
      new NotFoundError(`Environment has no submodel with identifier "${submodelIdShort}".`),
    );
    await (service as any).processRun(run.id);

    expect(item.status).toEqual("failed");
    expect(item.error).toContain(submodelIdShort);
    expect(run.failedCount).toEqual(1);
  });

  it("isolates a per-row failure from another passport-write error", async () => {
    const {
      service,
      configRepository,
      runRepository,
      runItemRepository,
      productLinkRepository,
      passportService,
    } = buildFakes();
    const config = buildConfig();
    const run = BulkImportRun.create({
      bulkImportConfigId: config.id,
      organizationId: config.organizationId,
      subject: SubjectAttributes.create({ userRole: UserRole.USER }),
      userId: randomUUID(),
      totalCount: 2,
    });
    const failingItem = BulkImportRunItem.create({
      runId: run.id,
      rowIndex: 0,
      inputData: { sku: "bad", weightKg: 1 },
    });
    const okItem = BulkImportRunItem.create({
      runId: run.id,
      rowIndex: 1,
      inputData: { sku: "good", weightKg: 2 },
    });

    configRepository.findOneOrFail.mockResolvedValue(config);
    runRepository.findOneOrFail.mockResolvedValue(run);
    runItemRepository.findAllByRunId.mockResolvedValue([failingItem, okItem]);
    productLinkRepository.findOne.mockResolvedValue(undefined);
    passportService.createPassportFromTemplate.mockImplementation(async () => {
      throw new Error("boom");
    });

    await (service as any).processRun(run.id);

    expect(failingItem.status).toEqual("failed");
    expect(failingItem.error).toEqual("boom");
    // okItem also hits the same failing stub, proving the loop kept going past the first failure.
    expect(okItem.status).toEqual("failed");
    expect(run.succeededCount).toEqual(0);
    expect(run.failedCount).toEqual(2);
    expect(runItemRepository.save).toHaveBeenCalledTimes(2);
  });

  it("processRun on resume only reprocesses rows still pending, leaving resolved rows untouched", async () => {
    const {
      service,
      configRepository,
      runRepository,
      runItemRepository,
      productLinkRepository,
      passportService,
    } = buildFakes();
    const config = buildConfig();
    const run = BulkImportRun.create({
      bulkImportConfigId: config.id,
      organizationId: config.organizationId,
      subject: SubjectAttributes.create({ userRole: UserRole.USER }),
      userId: randomUUID(),
      totalCount: 2,
    });
    // Simulates state as it stood right before the crash: one row already finished...
    run.recordItemOutcome(true);
    const alreadyCreatedItem = BulkImportRunItem.create({
      runId: run.id,
      rowIndex: 0,
      inputData: { sku: "done", weightKg: 1 },
    });
    alreadyCreatedItem.markCreated("passport-already-done");
    // ...and one row that never got started.
    const pendingItem = BulkImportRunItem.create({
      runId: run.id,
      rowIndex: 1,
      inputData: { sku: "todo", weightKg: 2 },
    });

    configRepository.findOneOrFail.mockResolvedValue(config);
    runRepository.findOneOrFail.mockResolvedValue(run);
    runItemRepository.findAllByRunId.mockResolvedValue([alreadyCreatedItem, pendingItem]);
    productLinkRepository.findOne.mockResolvedValue(undefined);
    passportService.createPassportFromTemplate.mockResolvedValue({
      id: "passport-new",
    } as Passport);

    await (service as any).processRun(run.id);

    expect(passportService.createPassportFromTemplate).toHaveBeenCalledTimes(1);
    expect(passportService.createPassportFromTemplate).toHaveBeenCalledWith(
      run.organizationId,
      config.templateId,
      run.subject,
      expect.anything(),
    );
    expect(alreadyCreatedItem.passportId).toEqual("passport-already-done");
    expect(pendingItem.status).toEqual("created");
    expect(pendingItem.passportId).toEqual("passport-new");
    // 1 from before the crash + 1 from this resume, not double-counted.
    expect(run.succeededCount).toEqual(2);
    expect(run.status).toEqual(BulkImportRunStatusDto.Completed);
    expect(runItemRepository.save).toHaveBeenCalledTimes(1);
  });

  it("onApplicationBootstrap resumes stale runs instead of marking them interrupted", async () => {
    const { service, runRepository } = buildFakes();
    const run = BulkImportRun.create({
      bulkImportConfigId: randomUUID(),
      organizationId: randomUUID(),
      subject: SubjectAttributes.create({ userRole: UserRole.USER }),
      userId: randomUUID(),
      totalCount: 1,
    });
    run.start();
    runRepository.findAllRunning.mockResolvedValue([run]);
    const processRunSpy = jest
      .spyOn(service as any, "processRun")
      .mockResolvedValue(undefined as never);

    await service.onApplicationBootstrap();

    expect(processRunSpy).toHaveBeenCalledWith(run.id);
    expect(run.status).toEqual(BulkImportRunStatusDto.Running);
    expect(runRepository.save).not.toHaveBeenCalled();
  });

  it("findAllByBulkImportConfigId delegates to the repository", async () => {
    const { service, runRepository } = buildFakes();
    const page = PagingResult.create({ pagination: Pagination.create({}), items: [] });
    runRepository.findAllByBulkImportConfigId.mockResolvedValue(page);

    const result = await service.findAllByBulkImportConfigId("config-1");

    expect(result).toBe(page);
    expect(runRepository.findAllByBulkImportConfigId).toHaveBeenCalledWith("config-1", {
      pagination: undefined,
    });
  });

  it("findByIdAndCheckOwnership rejects a run from another organization", async () => {
    const { service, runRepository } = buildFakes();
    const run = BulkImportRun.create({
      bulkImportConfigId: randomUUID(),
      organizationId: "other-org",
      subject: SubjectAttributes.create({ userRole: UserRole.USER }),
      userId: randomUUID(),
      totalCount: 1,
    });
    runRepository.findOneOrFail.mockResolvedValue(run);

    await expect(service.findByIdAndCheckOwnership(run.id, "my-org")).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("findItemsForRun checks ownership before returning the run's items", async () => {
    const { service, runRepository, runItemRepository } = buildFakes();
    const run = BulkImportRun.create({
      bulkImportConfigId: randomUUID(),
      organizationId: "my-org",
      subject: SubjectAttributes.create({ userRole: UserRole.USER }),
      userId: randomUUID(),
      totalCount: 1,
    });
    const item = BulkImportRunItem.create({ runId: run.id, rowIndex: 0, inputData: { sku: "1" } });
    runRepository.findOneOrFail.mockResolvedValue(run);
    runItemRepository.findAllByRunId.mockResolvedValue([item]);

    const items = await service.findItemsForRun(run.id, "my-org");

    expect(items).toEqual([item]);
    expect(runItemRepository.findAllByRunId).toHaveBeenCalledWith(run.id);
  });

  it("findItemsForRun rejects a run from another organization", async () => {
    const { service, runRepository, runItemRepository } = buildFakes();
    const run = BulkImportRun.create({
      bulkImportConfigId: randomUUID(),
      organizationId: "other-org",
      subject: SubjectAttributes.create({ userRole: UserRole.USER }),
      userId: randomUUID(),
      totalCount: 1,
    });
    runRepository.findOneOrFail.mockResolvedValue(run);

    await expect(service.findItemsForRun(run.id, "my-org")).rejects.toThrow(ForbiddenException);
    expect(runItemRepository.findAllByRunId).not.toHaveBeenCalled();
  });
});
