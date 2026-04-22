import { Logger, type INestApplicationContext } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { PresentationReferenceType } from "@open-dpp/dto";
import type { Model } from "mongoose";
import type { PassportDoc } from "../../passports/infrastructure/passport.schema";
import { PassportDoc as PassportDocClass } from "../../passports/infrastructure/passport.schema";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { PermalinkRepository } from "../infrastructure/permalink.repository";

export interface BackfillResult {
  created: number;
  existing: number;
  failed: number;
  failedIds: ReadonlyArray<string>;
}

// Safe to re-run: `findOrCreateByReference` and `findOrCreateByPresentationConfigurationId`
// are idempotent — existing rows are returned unchanged and the summary reports them as
// "existing".
export async function runBackfill(context: INestApplicationContext): Promise<BackfillResult> {
  const logger = new Logger("PermalinkBackfill");
  const permalinkRepository = context.get(PermalinkRepository);
  const presentationConfigurationRepository = context.get(PresentationConfigurationRepository);
  const passportDoc = context.get<Model<PassportDoc>>(getModelToken(PassportDocClass.name));

  const failedIds: string[] = [];
  let created = 0;
  let existingCount = 0;

  // Iterate passports directly so we also materialize the PresentationConfiguration
  // for passports that never had one yet (the config is lazily created on first
  // authenticated access). Without this, legacy passports would never get a
  // permalink because there'd be no passport-type config row to key off.
  const cursor = passportDoc.find({}).cursor();

  let processed = 0;
  for await (const doc of cursor) {
    const passportId = String(doc._id);
    try {
      const config = await presentationConfigurationRepository.findOrCreateByReference({
        referenceType: PresentationReferenceType.Passport,
        referenceId: passportId,
        organizationId: doc.organizationId,
      });

      const existing = await permalinkRepository.findByPresentationConfigurationId(config.id);
      if (existing) {
        existingCount += 1;
      } else {
        await permalinkRepository.findOrCreateByPresentationConfigurationId({
          presentationConfigurationId: config.id,
        });
        created += 1;
      }
    } catch (error) {
      failedIds.push(passportId);
      logger.error(`Failed to backfill permalink for passport ${passportId}`, error as Error);
    }

    processed += 1;
    if (processed % 100 === 0) {
      logger.log(`Processed ${processed} passports...`);
    }
  }

  if (failedIds.length > 0) {
    logger.error(`Failed passport ids (rerun targets): ${failedIds.join(", ")}`);
  }
  logger.log(
    `Backfill complete — created: ${created}, existing: ${existingCount}, failed: ${failedIds.length}`,
  );
  return { created, existing: existingCount, failed: failedIds.length, failedIds };
}
