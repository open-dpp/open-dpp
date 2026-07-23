import { ForbiddenException, Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ApiVersionsDto, BulkImportRunItemStatusDto, ValueRequestDto } from "@open-dpp/dto";
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
      this.logger.warn(`Resuming ${staleRuns.length} bulk import run(s) interrupted by the last restart.`);
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

    const items = rows.map((row, rowIndex) =>
      BulkImportRunItem.create({ runId: run.id, rowIndex, inputData: row }),
    );
    await this.bulkImportRunItemRepository.createMany(items);

    // Fire-and-forget: the caller gets the pending run back immediately, per the async execution model.
    this.processRun(run.id).catch((error: unknown) => {
      this.logger.error(`Bulk import run ${run.id} failed unexpectedly`, error);
    });

    return run;
  }

  /** Caller is expected to have already checked ownership of the owning config. */
  async findAllByBulkImportConfigId(
    bulkImportConfigId: string,
    pagination?: Pagination,
  ): Promise<PagingResult<BulkImportRun>> {
    return await this.bulkImportRunRepository.findAllByBulkImportConfigId(
      bulkImportConfigId,
      pagination,
    );
  }

  async findByIdAndCheckOwnership(id: string, organizationId: string): Promise<BulkImportRun> {
    const run = await this.bulkImportRunRepository.findOneOrFail(id);
    if (run.organizationId !== organizationId) {
      throw new ForbiddenException();
    }
    return run;
  }

  async findItemsForRun(id: string, organizationId: string): Promise<BulkImportRunItem[]> {
    await this.findByIdAndCheckOwnership(id, organizationId);
    return await this.bulkImportRunItemRepository.findAllByRunId(id);
  }

  private async processRun(runId: string): Promise<void> {
    const run = await this.bulkImportRunRepository.findOneOrFail(runId);
    const config = await this.bulkImportConfigRepository.findOneOrFail(run.bulkImportConfigId);
    const items = await this.bulkImportRunItemRepository.findAllByRunId(runId);
    // Only unresolved rows: on a resume, already-created/updated/failed rows must stay untouched.
    const pendingItems = items.filter((item) => item.status === BulkImportRunItemStatusDto.Pending);

    run.start();
    await this.bulkImportRunRepository.save(run);

    for (const item of pendingItems) {
      try {
        await this.applyRowToPassport(run, config, item);
        run.recordItemOutcome(true);
      } catch (error) {
        item.markFailed(error instanceof Error ? error.message : String(error));
        run.recordItemOutcome(false);
      }
      await this.bulkImportRunItemRepository.save(item);
    }

    run.complete();
    await this.bulkImportRunRepository.save(run);
  }

  private async applyRowToPassport(
    run: BulkImportRun,
    config: BulkImportConfig,
    item: BulkImportRunItem,
  ): Promise<void> {
    const idValue = await config.extractIdValue(item.inputData);
    if (!idValue) {
      throw new Error(`Row is missing a value for id field "${config.idField}".`);
    }

    const existingLink = await this.bulkImportProductLinkRepository.findOne(
      run.organizationId,
      config.templateId,
      idValue,
    );

    const passportId = existingLink
      ? existingLink.passportId
      : await this.createPassportAndLink(run, config, idValue);

    const valueRepresentations = await config.applyToRow(item.inputData);
    for (const [submodelId, valueRepresentation] of valueRepresentations) {
      await this.passportService.digitalProductDocumentService.modifyValueOfSubmodel(
        run.id,
        run.organizationId,
        passportId,
        submodelId,
        valueRepresentation as ValueRequestDto,
        { subject: run.subject, userId: run.userId },
        ApiVersionsDto.v2,
      );
    }

    if (existingLink) {
      item.markUpdated(passportId);
    } else {
      item.markCreated(passportId);
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
