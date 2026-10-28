import { Type } from "@nestjs/common";
import { Migration } from "./domain/migration";
import { AlignOrganizationSlugsMigration } from "./scripts/20261013162954-align-organization-slugs";

export const MIGRATION_CLASSES: Type<Migration>[] = [AlignOrganizationSlugsMigration];
