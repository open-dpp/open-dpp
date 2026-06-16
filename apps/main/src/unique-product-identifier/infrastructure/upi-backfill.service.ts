import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model as MongooseModel } from "mongoose";

import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { UniqueProductIdentifierDoc } from "./unique-product-identifier.schema";
import { UniqueProductIdentifierRepository } from "./unique-product-identifier.repository";

/**
 * One-shot, idempotent backfill runner for UniqueProductIdentifiers.
 *
 * Responsibility: Populate `organizationId` on UPI rows that lack it.
 * The value is derived via `UPI.referenceId -> passport.organizationId`.
 *
 * Idempotent: rows whose `organizationId` is already set are skipped.
 *
 * NOT auto-run on every boot.
 */
@Injectable()
export class UpiBackfillService {
  private readonly logger = new Logger(UpiBackfillService.name);

  constructor(
    @InjectModel(UniqueProductIdentifierDoc.name)
    private readonly upiDocModel: MongooseModel<UniqueProductIdentifierDoc>,
    private readonly upiRepository: UniqueProductIdentifierRepository,
    private readonly passportRepository: PassportRepository,
  ) {}

  async run(): Promise<void> {
    await this.backfillOrganizationIds();
  }

  private async backfillOrganizationIds(): Promise<void> {
    const missingOrgDocs = await this.upiDocModel
      .find({ organizationId: { $eq: null } })
      .lean()
      .exec();

    if (missingOrgDocs.length === 0) {
      return;
    }

    const referenceIds = [
      ...new Set(
        missingOrgDocs
          .map((d) => d.referenceId as string)
          .filter((id): id is string => typeof id === "string"),
      ),
    ];

    const passportMap = await this.passportRepository.findByIds(referenceIds);

    for (const rawDoc of missingOrgDocs) {
      const referenceId = rawDoc.referenceId as string;
      const passport = passportMap.get(referenceId);
      if (!passport) {
        this.logger.warn(
          `[UpiBackfillService] Passport ${referenceId} not found - skipping UPI ${rawDoc._id}`,
        );
        continue;
      }
      try {
        const upi = await this.upiRepository.findOneOrFail(rawDoc._id.toString());
        const updated = upi.withOrganizationId(passport.organizationId);
        await this.upiRepository.save(updated);
      } catch (error) {
        this.logger.warn(`[UpiBackfillService] Failed to backfill UPI ${rawDoc._id}: ${error}`);
      }
    }
  }
}
