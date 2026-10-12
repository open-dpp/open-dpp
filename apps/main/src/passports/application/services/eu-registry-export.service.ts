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
   * Yields each full registry file (100 items) as soon as it is complete, and the remaining items
   * at the end. Passports without a published permalink do not fail the export; they are
   * reported in `failedPassportIds` of the generator's return value.
   * Throws NotFoundError on the first `next()`, before anything is yielded, if no Published
   * passport matches.
   */
  async *exportFiles(
    organizationId: string,
    filter: EuRegistryExportFilter,
  ): AsyncGenerator<RegistryExportFile, EuRegistryExportResult> {
    const failedPassportIds: string[] = [];
    let exportedCount = 0;
    let buffer: RegistryExportItem[] = [];
    let isFirstPage = true;

    // Takes complete files; unless `all`, an incomplete last file stays in the buffer.
    const takeFiles = (all: boolean): RegistryExportFile[] => {
      const files = RegistryExportFile.fromExportItems(EuRegistryProductGroup.Batteries, buffer);
      const last = files.at(-1);
      const keepLast =
        !all && last !== undefined && last.items.length < REGISTRY_EXPORT_MAX_ITEMS_PER_FILE;
      const completedFiles = keepLast ? files.slice(0, -1) : files;
      buffer = keepLast ? [...last.items] : [];
      return completedFiles;
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
      yield* takeFiles(false);
    } while (pagination.cursor);
    yield* takeFiles(true);

    return { exportedCount, failedPassportIds };
  }
}
