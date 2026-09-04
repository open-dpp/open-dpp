import { ForbiddenException, Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ApiVersionsDto, BulkImportRunItemStatusDto } from "@open-dpp/dto";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import { TransactionService } from "../../../database/transaction.service";
import { Pagination } from "../../../pagination/pagination";
import { PagingResult } from "../../../pagination/paging-result";
import { PassportService } from "../../../passports/application/services/passport.service";
import { BulkImportConfig } from "../../domain/bulk-import-config";
import { BulkImportProductLink } from "../../domain/bulk-import-product-link";
import { BulkImportRun } from "../../domain/bulk-import-run";
import { BulkImportRunItem } from "../../domain/bulk-import-run-item";
import { BulkImportConfigRepository } from "../../infrastructure/bulk-import-config.repository";
import { BulkImportProductLinkRepository } from "../../infrastructure/bulk-import-product-link.repository";
import { BulkImportRunItemRepository } from "../../infrastructure/bulk-import-run-item.repository";
import { BulkImportRunRepository } from "../../infrastructure/bulk-import-run.repository";
import { ValueError } from "@open-dpp/exception";

@Injectable()
export class BulkImportRunService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BulkImportRunService.name);

  constructor(
    private readonly bulkImportRunRepository: BulkImportRunRepository,
    private readonly bulkImportRunItemRepository: BulkImportRunItemRepository,
    private readonly bulkImportConfigRepository: BulkImportConfigRepository,
    private readonly bulkImportProductLinkRepository: BulkImportProductLinkRepository,
    private readonly passportService: PassportService,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Any run still pending/running died with the previous process. processRun() only touches
   * items still `pending`, so resuming is safe - already-resolved rows are left untouched and
   * won't be double-counted against the run's totals.
   */
  async onApplicationBootstrap(): Promise<void> {
    const staleRuns = await this.bulkImportRunRepository.findAllRunning();
    for (const run of staleRuns) {
      this.processRun(run.id).catch((error: unknown) => {
        this.logger.error(`Resuming bulk import run ${run.id} failed unexpectedly`, error);
      });
    }
    if (staleRuns.length > 0) {
      this.logger.warn(
        `Resuming ${staleRuns.length} bulk import run(s) interrupted by the last restart.`,
      );
    }
  }

  async createRun(
    config: BulkImportConfig,
    rows: Record<string, unknown>[],
    subject: SubjectAttributes,
    userId: string,
  ): Promise<BulkImportRun> {
    const run = BulkImportRun.create({
      bulkImportConfigId: config.id,
      organizationId: config.organizationId,
      subject,
      userId,
      totalCount: rows.length,
    });
    await this.bulkImportRunRepository.save(run);

    const items = await Promise.all(
      rows.map(async (row, rowIndex) =>
        BulkImportRunItem.create({
          runId: run.id,
          rowIndex,
          inputData: row,
          externalId: await this.extractExternalId(config, row),
        }),
      ),
    );
    await this.bulkImportRunItemRepository.createMany(items);

    // Fire-and-forget: the caller gets the pending run back immediately, per the async execution model.
    this.processRun(run.id).catch((error: unknown) => {
      this.logger.error(`Bulk import run ${run.id} failed unexpectedly`, error);
    });

    return run;
  }

  /** One bad row's id expression shouldn't stop the rest of the rows from being created. */
  private async extractExternalId(
    config: BulkImportConfig,
    row: Record<string, unknown>,
  ): Promise<string | null> {
    try {
      return (await config.extractIdValue(row)) ?? null;
    } catch {
      return null;
    }
  }

  /** Caller is expected to have already checked ownership of the owning config. */
  async findAllByBulkImportConfigId(
    bulkImportConfigId: string,
    pagination?: Pagination,
  ): Promise<PagingResult<BulkImportRun>> {
    return await this.bulkImportRunRepository.findAllByBulkImportConfigId(bulkImportConfigId, {
      pagination: pagination,
    });
  }

  async findByIdAndCheckOwnership(id: string, organizationId: string): Promise<BulkImportRun> {
    const run = await this.bulkImportRunRepository.findOneOrFail(id);
    if (run.organizationId !== organizationId) {
      throw new ForbiddenException();
    }
    return run;
  }

  async findItemsForRun(
    id: string,
    organizationId: string,
    pagination?: Pagination,
  ): Promise<PagingResult<BulkImportRunItem>> {
    await this.findByIdAndCheckOwnership(id, organizationId);
    return await this.bulkImportRunItemRepository.findAllByRunId(id, pagination);
  }

  async interruptRun(id: string, organizationId: string): Promise<BulkImportRun> {
    const run = await this.findByIdAndCheckOwnership(id, organizationId);
    if (!run.isRunning()) {
      return run;
    }
    run.markInterrupted();
    await this.bulkImportRunRepository.save(run);
    return run;
  }

  private async processRun(runId: string): Promise<void> {
    let run = await this.bulkImportRunRepository.findOneOrFail(runId);
    const config = await this.bulkImportConfigRepository.findOneOrFail(run.bulkImportConfigId);
    const pagingResult = await this.bulkImportRunItemRepository.findAllByRunId(
      runId,
      Pagination.create({ limit: undefined }),
    );
    // Only unresolved rows: on a resume, already-created/updated/failed rows must stay untouched.
    const pendingItems = run.startOrResume(
      pagingResult.items.filter((item) => item.status === BulkImportRunItemStatusDto.Pending),
    );

    await this.bulkImportRunRepository.save(run);

    let processedCount = 0;
    let batchSuccessCount = 0;
    let batchFailCount = 0;
    for (const item of pendingItems) {
      try {
        await this.applyRowToPassport(run, config, item);
        batchSuccessCount++;
      } catch (error) {
        item.markFailed(error instanceof Error ? error.message : String(error));
        batchFailCount++;
      }
      await this.bulkImportRunItemRepository.save(item);

      processedCount++;
      if (processedCount % 50 === 0) {
        // Check for interruption by fetching fresh state
        run = await this.bulkImportRunRepository.findOneOrFail(runId);
        // Apply batch outcomes to the fresh run
        for (let i = 0; i < batchSuccessCount; i++) run.recordItemOutcome(true);
        for (let i = 0; i < batchFailCount; i++) run.recordItemOutcome(false);
        run = await this.bulkImportRunRepository.save(run);
        // Reset batch counters
        batchSuccessCount = 0;
        batchFailCount = 0;
        if (!run.isRunning()) {
          break;
        }
      }
    }

    if (run.isRunning()) {
      // Apply any remaining outcomes from the final partial batch
      for (let i = 0; i < batchSuccessCount; i++) run.recordItemOutcome(true);
      for (let i = 0; i < batchFailCount; i++) run.recordItemOutcome(false);
      run.complete();
      await this.bulkImportRunRepository.save(run);
    }
  }

  private async applyRowToPassport(
    run: BulkImportRun,
    config: BulkImportConfig,
    item: BulkImportRunItem,
  ): Promise<void> {
    const idValue = item.externalId;
    if (!idValue) {
      throw new ValueError(`Row is missing a value for id field "${config.idField}".`);
    }

    const existingLink = await this.bulkImportProductLinkRepository.findOne(
      run.organizationId,
      config.templateId,
      idValue,
    );

    const passportId = existingLink
      ? existingLink.passportId
      : await this.createPassportAndLink(run, config, idValue);
    item.assignPassport(passportId);
    const valueRepresentations = await config.applyToRow(item.inputData);
    await this.passportService.digitalProductDocumentService.modifyValueOfMultipleSubmodels(
      run.id,
      run.organizationId,
      passportId,
      valueRepresentations,
      { subject: run.subject, userId: run.userId },
      ApiVersionsDto.v2,
    );

    if (existingLink) {
      item.markUpdated();
    } else {
      item.markCreated();
    }
  }

  /**
   * Creates the passport and its BulkImportProductLink in one transaction, so a crash between
   * the two (e.g. mid-restart) can never leave an orphaned passport with no link pointing to it -
   * which would otherwise cause a duplicate passport to be created if the run is resumed.
   */
  private async createPassportAndLink(
    run: BulkImportRun,
    config: BulkImportConfig,
    idValue: string,
  ): Promise<string> {
    return await this.transactionService.withTransaction(async (options) => {
      const passport = await this.passportService.createPassportFromTemplate(
        run.organizationId,
        config.templateId,
        run.subject,
        options,
      );
      await this.bulkImportProductLinkRepository.save(
        BulkImportProductLink.create({
          organizationId: run.organizationId,
          templateId: config.templateId,
          externalId: idValue,
          passportId: passport.id,
        }),
        options,
      );
      return passport.id;
    });
  }
}
