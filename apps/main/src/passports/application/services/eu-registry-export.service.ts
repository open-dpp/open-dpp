import { Injectable } from "@nestjs/common";
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
    let seenPassports = 0;

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
      seenPassports += page.items.length;
      if (seenPassports === 0) {
        throw new NotFoundError("No published passports match the given filters.");
      }
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
}
