import { Type } from "@nestjs/common";
import { Migration } from "./domain/migration";
import { AlignOrganizationSlugsMigration } from "./scripts/20261013162954-align-organization-slugs";
import { BackfillPassportStatusMigration } from "./scripts/20261014064850-backfill-passport-status";

export const MIGRATION_CLASSES: Type<Migration>[] = [
  AlignOrganizationSlugsMigration,
  BackfillPassportStatusMigration,
];
