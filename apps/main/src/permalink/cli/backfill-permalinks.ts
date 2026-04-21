import { Logger, type INestApplicationContext } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import type { PassportDoc } from "../../passports/infrastructure/passport.schema";
import { PassportDoc as PassportDocClass } from "../../passports/infrastructure/passport.schema";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { PermalinkRepository } from "../infrastructure/permalink.repository";

export interface BackfillResult {
  created: number;
  existing: number;
  failed: number;
}

export async function runBackfill(context: INestApplicationContext): Promise<BackfillResult> {
  const logger = new Logger("PermalinkBackfill");
  const permalinkRepository = context.get(PermalinkRepository);
  const presentationConfigurationRepository = context.get(PresentationConfigurationRepository);
  const passportDoc = context.get<Model<PassportDoc>>(getModelToken(PassportDocClass.name));

  const summary: BackfillResult = { created: 0, existing: 0, failed: 0 };

  // Iterate passports directly so we also materialize the PresentationConfiguration
  // for passports that never had one yet (the config is lazily created on first
  // authenticated access). Without this, legacy passports would never get a
  // permalink because there'd be no passport-type config row to key off.
  const cursor = passportDoc.find({}).cursor();

  let processed = 0;
  for await (const doc of cursor) {
    try {
      const config = await presentationConfigurationRepository.findOrCreateByReference({
        referenceType: "passport",
        referenceId: doc._id,
        organizationId: doc.organizationId,
      });

      const existing = await permalinkRepository.findByPresentationConfigurationId(config.id);
      if (existing) {
        summary.existing += 1;
      } else {
        await permalinkRepository.findOrCreateByPresentationConfigurationId({
          presentationConfigurationId: config.id,
        });
        summary.created += 1;
      }
    } catch (error) {
      summary.failed += 1;
      logger.error(`Failed to backfill permalink for passport ${doc._id}`, error as Error);
    }

    processed += 1;
    if (processed % 100 === 0) {
      logger.log(`Processed ${processed} passports...`);
    }
  }

  logger.log(
    `Backfill complete — created: ${summary.created}, existing: ${summary.existing}, failed: ${summary.failed}`,
  );
  return summary;
}
