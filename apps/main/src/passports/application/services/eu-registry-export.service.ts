import { Injectable } from "@nestjs/common";
import { NotFoundError, ValueError } from "@open-dpp/exception";
import { DigitalProductDocumentStatus } from "../../../digital-product-document/domain/digital-product-document-status";
import { Pagination } from "../../../pagination/pagination";
import { PermalinkRepository } from "../../../permalink/infrastructure/permalink.repository";
import { Period } from "../../../time/period";
import { EuRegistryProductGroup, RegistryExportFile } from "../../domain/registry-export-file";
import { RegistryExportItem } from "../../domain/registry-export-item";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";

export interface EuRegistryExportFilter {
  templateIds?: ReadonlyArray<string>;
  period?: Period;
}

export interface EuRegistryExportResult {
  /** Registry files in order, at most 100 items each. */
  files: RegistryExportFile[];
  exportedCount: number;
}

const PAGE_SIZE = 100;

@Injectable()
export class EuRegistryExportService {
  constructor(
    private readonly passportRepository: PassportRepository,
    private readonly permalinkRepository: PermalinkRepository,
  ) {}

  async export(
    organizationId: string,
    filter: EuRegistryExportFilter = {},
  ): Promise<EuRegistryExportResult> {
    const passports = await this.loadPublishedPassportsOldestFirst(organizationId, filter);
    if (passports.length === 0) {
      throw new NotFoundError("No published passports match the given filters.");
    }

    const items: RegistryExportItem[] = [];
    const passportIdsWithoutIdentifier: string[] = [];
    for (const passport of passports) {
      const permalinks = await this.permalinkRepository.findAllByPassportId(passport.id);
      const item = RegistryExportItem.fromPermalinks(permalinks);
      if (item) {
        items.push(item);
      } else {
        passportIdsWithoutIdentifier.push(passport.id);
      }
    }
    if (passportIdsWithoutIdentifier.length > 0) {
      throw new ValueError(
        `Passports without a published permalink cannot be exported: ${passportIdsWithoutIdentifier.join(", ")}`,
      );
    }

    return {
      files: RegistryExportFile.fromExportItems(EuRegistryProductGroup.Batteries, items),
      exportedCount: items.length,
    };
  }

  private async loadPublishedPassportsOldestFirst(
    organizationId: string,
    filter: EuRegistryExportFilter,
  ): Promise<Passport[]> {
    const newestFirst: Passport[] = [];
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
      newestFirst.push(...page.items);
    } while (pagination.cursor);
    return newestFirst.reverse();
  }
}
