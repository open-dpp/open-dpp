import { Injectable } from "@nestjs/common";
import { Archiver } from "archiver";
import { Response } from "express";
import { NotFoundError } from "@open-dpp/exception";
import { DigitalProductDocumentStatus } from "../../../digital-product-document/domain/digital-product-document-status";
import { Pagination } from "../../../pagination/pagination";
import { PermalinkRepository } from "../../../permalink/infrastructure/permalink.repository";
import { Period } from "../../../time/period";
import {
  EuRegistryProductGroup,
  REGISTRY_EXPORT_MAX_ITEMS_PER_FILE,
  RegistryExportFile,
} from "../../domain/registry-export-file";
import { RegistryExportItem } from "../../domain/registry-export-item";
import { PassportRepository } from "../../infrastructure/passport.repository";

export interface EuRegistryExportFilter {
  templateIds?: ReadonlyArray<string>;
  period?: Period;
}

export interface EuRegistryExportResult {
  exportedCount: number;
  /** Passports that could not be exported because they have no published permalink. */
  failedPassportIds: string[];
}

const PAGE_SIZE = 100;

@Injectable()
export class EuRegistryExportService {
  constructor(
    private readonly passportRepository: PassportRepository,
    private readonly permalinkRepository: PermalinkRepository,
  ) {}

  /**
   * Walks the matching Published passports page by page (newest first), so memory stays flat.
   * `onFile` is called with each full registry file (100 items) as soon as it is complete, and with
   * the remaining items at the end. Passports without a published permalink do not fail the
   * export; they are returned in `failedPassportIds`.
   * Throws NotFoundError before `onFile` is called if no Published passport matches.
   */
  async export(
    organizationId: string,
    filter: EuRegistryExportFilter,
    onFile: (file: RegistryExportFile) => Promise<void> | void,
  ): Promise<EuRegistryExportResult> {
    const failedPassportIds: string[] = [];
    let exportedCount = 0;
    let buffer: RegistryExportItem[] = [];
    let isFirstPage = true;

    // Emits complete files; unless `all`, an incomplete last file stays in the buffer.
    const flush = async (all: boolean) => {
      const files = RegistryExportFile.fromExportItems(EuRegistryProductGroup.Batteries, buffer);
      const last = files.at(-1);
      const keepLast =
        !all && last !== undefined && last.items.length < REGISTRY_EXPORT_MAX_ITEMS_PER_FILE;
      const completedFiles = keepLast ? files.slice(0, -1) : files;
      for (const file of completedFiles) {
        await onFile(file);
      }
      buffer = keepLast ? [...last.items] : [];
    };

    const pagination = Pagination.create({ limit: PAGE_SIZE });
    do {
      const page = await this.passportRepository.findAllByOrganizationId(organizationId, {
        pagination,
        filter: {
          status: [DigitalProductDocumentStatus.Published],
          period: filter.period,
          templateIds: filter.templateIds,
        },
      });
      if (isFirstPage && page.items.length === 0) {
        throw new NotFoundError("No published passports match the given filters.");
      }
      isFirstPage = false;
      for (const passport of page.items) {
        const permalinks = await this.permalinkRepository.findAllByPassportId(passport.id);
        const item = RegistryExportItem.fromPermalinks(permalinks);
        if (item) {
          buffer.push(item);
          exportedCount++;
        } else {
          failedPassportIds.push(passport.id);
        }
      }
      await flush(false);
    } while (pagination.cursor);
    await flush(true);

    return { exportedCount, failedPassportIds };
  }

  /**
   * Streams the export as ZIP into `res`: one `<product-group>-<nnn>.json` per registry file and,
   * if some passports could not be exported, a `failed-passports.json`.
   * Errors before the first byte (e.g. no matching passports) are thrown so they become a 4xx;
   * an error afterwards aborts the response.
   */
  async exportToArchive(
    res: Response,
    organizationId: string,
    filter: EuRegistryExportFilter,
    archive: Archiver,
    now: Date = new Date(),
  ): Promise<void> {
    let fileNumber = 0;
    let started = false;
    const ensureStarted = () => {
      if (started) return;
      started = true;
      res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="eu-registry-export-${now.toISOString().slice(0, 10)}.zip"`,
      });
      archive.pipe(res);
    };
    try {
      const result = await this.export(organizationId, filter, (file) => {
        ensureStarted();
        fileNumber++;
        archive.append(JSON.stringify(file.toPlain(), null, 2), {
          name: `${file.productGroup.toLowerCase()}-${String(fileNumber).padStart(3, "0")}.json`,
        });
      });
      if (result.failedPassportIds.length > 0) {
        ensureStarted();
        archive.append(
          JSON.stringify(
            result.failedPassportIds.map((passportId) => ({
              passportId,
              reason: "No published permalink",
            })),
            null,
            2,
          ),
          { name: "failed-passports.json" },
        );
      }
      await archive.finalize();
    } catch (error) {
      if (!started) throw error;
      archive.abort();
      res.destroy(error instanceof Error ? error : undefined);
    }
  }
}
