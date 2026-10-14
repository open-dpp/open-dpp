import type { Connection } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Migration } from "../domain/migration";

/**
 * TODO: describe what this migration changes and why.
 */
@Injectable()
export class BackfillPassportStatusMigration implements Migration {
  readonly id = "20261014064850-backfill-passport-status";

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async up(): Promise<void> {
    // Must be safe to rerun and leave the data readable by the previous release.
    throw new Error("Migration 20261014064850-backfill-passport-status is not implemented yet");
  }
}
