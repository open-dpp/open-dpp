import { Inject, Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { AppliedMigration } from "../../domain/applied-migration";
import { Migration, planMigrations } from "../../domain/migration";
import { AppliedMigrationRepository } from "../../infrastructure/applied-migration.repository";

export const MIGRATIONS = Symbol("MIGRATIONS");

/**
 * Runs every registered migration that has not been applied yet, oldest id first, and records
 * each one after it succeeded. A failing migration stops the run and aborts startup: later
 * migrations may rely on it, and the app must not serve a half-migrated database. The failed
 * migration is retried on the next start.
 *
 * Warns about recorded migrations this version does not know (usually an older app version
 * running against a newer database) and about pending migrations older than an applied one
 * (usually a branch merged after a newer migration shipped); both cases still run.
 *
 * Not safe for concurrent starts of several instances yet.
 */
@Injectable()
export class MigrationRunnerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MigrationRunnerService.name);

  constructor(
    @Inject(MIGRATIONS) private readonly migrations: Migration[],
    private readonly appliedMigrationRepository: AppliedMigrationRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.runPending();
  }

  /** Returns the ids of the migrations applied by this run. */
  async runPending(): Promise<string[]> {
    const { pending, unknownAppliedIds, outOfOrderIds } = planMigrations(
      this.migrations,
      await this.appliedMigrationRepository.findAllIds(),
    );

    if (unknownAppliedIds.length > 0) {
      this.logger.warn(
        `The database contains migrations unknown to this version: ${unknownAppliedIds.join(", ")}. Is an older version running against a newer database?`,
      );
    }
    if (outOfOrderIds.length > 0) {
      this.logger.warn(
        `Applying migrations older than an already applied one: ${outOfOrderIds.join(", ")}`,
      );
    }

    if (pending.length === 0) {
      this.logger.log("No pending migrations");
      return [];
    }

    for (const migration of pending) {
      this.logger.log(`Applying migration ${migration.id}`);
      try {
        await migration.up();
      } catch (error) {
        this.logger.error(`Migration ${migration.id} failed`, error);
        throw error;
      }
      await this.appliedMigrationRepository.insert(AppliedMigration.create({ id: migration.id }));
    }

    this.logger.log(`Applied ${pending.length} migration(s)`);
    return pending.map((migration) => migration.id);
  }
}
