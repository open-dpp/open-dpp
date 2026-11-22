import { Type } from "@nestjs/common";
import { Migration } from "./domain/migration";
import { AlignOrganizationSlugsMigration } from "./scripts/20261013162954-align-organization-slugs";
import { UniquePassportFieldMediaMigration } from "./scripts/20261118180926-unique-passport-field-media";

export const MIGRATION_CLASSES: Type<Migration>[] = [
  AlignOrganizationSlugsMigration,
  UniquePassportFieldMediaMigration,
];
