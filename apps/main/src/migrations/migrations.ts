import { Type } from "@nestjs/common";
import { Migration } from "./domain/migration";
import { AlignOrganizationSlugsMigration } from "./scripts/20261013162954-align-organization-slugs";
import { DropUnusedMediaIndexMigration } from "./scripts/20261127142621-drop-unused-media-index";

export const MIGRATION_CLASSES: Type<Migration>[] = [
  AlignOrganizationSlugsMigration,
  DropUnusedMediaIndexMigration,
];
