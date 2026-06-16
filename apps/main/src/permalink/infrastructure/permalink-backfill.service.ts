import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model as MongooseModel } from "mongoose";

import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { PermalinkDoc } from "./permalink.schema";
import { PermalinkRepository } from "./permalink.repository";

/**
 * One-shot, idempotent backfill runner for permalinks.
 *
 * Responsibilities:
 * 1. Populate `organizationId` on permalinks that lack it.
 *    Resolution: presentationConfigurationId -> config.referenceId -> passport.organizationId.
 *    Orphan permalinks (passport not found) are skipped.
 * 2. Normalize the `primary` flag so that each passport has EXACTLY ONE primary
 *    presentation permalink (earliest by `createdAt`, ties broken by `_id` ascending).
 *
 * Idempotent: rows already in a valid state are never re-written.
 *
 * NOT auto-run on every boot.
 */
@Injectable()
export class PermalinkBackfillService {
  private readonly logger = new Logger(PermalinkBackfillService.name);

  constructor(
    @InjectModel(PermalinkDoc.name)
    private readonly permalinkDocModel: MongooseModel<PermalinkDoc>,
    private readonly permalinkRepository: PermalinkRepository,
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
    private readonly passportRepository: PassportRepository,
  ) {}

  async run(): Promise<void> {
    await this.backfillOrganizationIds();
    await this.normalizePrimary();
  }

  /**
   * Phase 1 - Populate missing `organizationId` values.
   *
   * Only covers presentation permalinks (those with a non-null presentationConfigurationId).
   * The organizationId is derived via: config.referenceId -> passport.organizationId.
   * Skips rows where the passport cannot be resolved (orphan permalinks).
   */
  private async backfillOrganizationIds(): Promise<void> {
    const missingOrgDocs = await this.permalinkDocModel
      .find({
        organizationId: { $eq: null },
        presentationConfigurationId: { $type: "string" },
      })
      .lean()
      .exec();

    if (missingOrgDocs.length === 0) {
      return;
    }

    // Batch-resolve configId -> passportId -> organizationId
    const configIds = [
      ...new Set(
        missingOrgDocs
          .map((d) => d.presentationConfigurationId as string | null)
          .filter((id): id is string => typeof id === "string"),
      ),
    ];

    // Step 1: configId -> passportId (from config.referenceId)
    const configToPassportId = new Map<string, string>();
    for (const configId of configIds) {
      const config = await this.presentationConfigurationRepository.findOne(configId);
      if (!config) {
        this.logger.warn(
          `[PermalinkBackfillService] Config ${configId} not found - skipping associated permalink(s)`,
        );
        continue;
      }
      configToPassportId.set(configId, config.referenceId);
    }

    // Step 2: passportId -> organizationId (batch lookup)
    const passportIds = [...new Set(Array.from(configToPassportId.values()))];
    const passportMap = await this.passportRepository.findByIds(passportIds);

    const configToOrgId = new Map<string, string>();
    for (const [configId, passportId] of configToPassportId) {
      const passport = passportMap.get(passportId);
      if (!passport) {
        this.logger.warn(
          `[PermalinkBackfillService] Passport ${passportId} not found - skipping permalinks for config ${configId}`,
        );
        continue;
      }
      configToOrgId.set(configId, passport.organizationId);
    }

    // Step 3: Persist the organizationId on each permalink via the domain path
    for (const rawDoc of missingOrgDocs) {
      const configId = rawDoc.presentationConfigurationId as string | null;
      if (!configId) continue;
      const orgId = configToOrgId.get(configId);
      if (!orgId) {
        // Orphan or unresolvable - skip without throwing
        continue;
      }
      try {
        const permalink = await this.permalinkRepository.findOneOrFail(rawDoc._id.toString());
        const updated = permalink.withOrganizationId(orgId);
        await this.permalinkRepository.save(updated);
      } catch (error) {
        this.logger.warn(
          `[PermalinkBackfillService] Failed to backfill permalink ${rawDoc._id}: ${error}`,
        );
      }
    }
  }

  /**
   * Phase 2 - Normalize the `primary` flag per passport.
   *
   * For each passport group, exactly one presentation permalink must be primary
   * (earliest `createdAt`, ties broken by `_id` ascending). Rows already in a
   * valid state are skipped.
   */
  private async normalizePrimary(): Promise<void> {
    const allPresentationDocs = await this.permalinkDocModel
      .find({ presentationConfigurationId: { $type: "string" } })
      .lean()
      .exec();

    if (allPresentationDocs.length === 0) {
      return;
    }

    // Resolve each configId to a passportId
    const configIds = [
      ...new Set(
        allPresentationDocs
          .map((d) => d.presentationConfigurationId as string | null)
          .filter((id): id is string => typeof id === "string"),
      ),
    ];

    const configToPassport = new Map<string, string>();
    for (const configId of configIds) {
      const config = await this.presentationConfigurationRepository.findOne(configId);
      if (config) {
        configToPassport.set(configId, config.referenceId);
      }
    }

    // Group by passportId
    const byPassport = new Map<string, typeof allPresentationDocs>();
    for (const doc of allPresentationDocs) {
      const configId = doc.presentationConfigurationId as string | null;
      if (!configId) continue;
      const passportId = configToPassport.get(configId);
      if (!passportId) continue;
      if (!byPassport.has(passportId)) {
        byPassport.set(passportId, []);
      }
      byPassport.get(passportId)!.push(doc);
    }

    for (const [passportId, docs] of byPassport) {
      const primaries = docs.filter((d) => d.primary === true);

      if (primaries.length === 1) {
        // Already valid - skip this passport group
        continue;
      }

      // Determine canonical primary: earliest createdAt, ties broken by _id ascending
      const sorted = [...docs].sort((a, b) => {
        const aTime = (a.createdAt as Date).getTime();
        const bTime = (b.createdAt as Date).getTime();
        if (aTime !== bTime) return aTime - bTime;
        const aId = a._id.toString();
        const bId = b._id.toString();
        return aId < bId ? -1 : aId > bId ? 1 : 0;
      });
      const canonicalId = sorted[0]._id.toString();

      for (const doc of docs) {
        const docId = doc._id.toString();
        const shouldBePrimary = docId === canonicalId;
        if (doc.primary === shouldBePrimary) {
          continue;
        }
        try {
          const permalink = await this.permalinkRepository.findOneOrFail(docId);
          const updated = permalink.withPrimary(shouldBePrimary);
          await this.permalinkRepository.save(updated);
        } catch (error) {
          this.logger.warn(
            `[PermalinkBackfillService] Failed to normalize primary on permalink ${docId} (passport ${passportId}): ${error}`,
          );
        }
      }
    }
  }
}
