import { ValueError } from "@open-dpp/exception";

/**
 * Migration ids start with the creation timestamp (UTC, `YYYYMMDDHHmmss`) followed by a
 * kebab-case name, e.g. `20261013162954-align-organization-slugs`. The id doubles as the
 * file name of the script and defines the order in which pending migrations run.
 */
export const MIGRATION_ID_PATTERN = /^\d{14}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * A one-time data migration. Runs at most once per database; once `up()` resolves, the id is
 * recorded and the migration is never run again. `up()` must be idempotent: if it fails
 * halfway it is retried as a whole on the next start.
 */
export interface Migration {
  readonly id: string;
  up: () => Promise<void>;
}

export function assertValidMigrationId(id: string): void {
  if (!MIGRATION_ID_PATTERN.test(id)) {
    throw new ValueError(
      `Migration id "${id}" must match <YYYYMMDDHHmmss>-<kebab-case-name>, e.g. 20261013162954-align-organization-slugs`,
    );
  }
}

/** Validates every id, rejects duplicates and returns the migrations in execution order. */
export function sortMigrations(migrations: Migration[]): Migration[] {
  const seen = new Set<string>();
  for (const migration of migrations) {
    assertValidMigrationId(migration.id);
    if (seen.has(migration.id)) {
      throw new ValueError(`Migration id "${migration.id}" is registered more than once`);
    }
    seen.add(migration.id);
  }
  return [...migrations].sort((a, b) => (a.id < b.id ? -1 : 1));
}

export interface MigrationPlan {
  /** Not yet applied, in execution order. */
  pending: Migration[];
  /** Applied to the database but not known to this version of the app. */
  unknownAppliedIds: string[];
  /** Pending, although a migration with a newer id has already been applied. */
  outOfOrderIds: string[];
}

export function planMigrations(migrations: Migration[], appliedIds: string[]): MigrationPlan {
  const sorted = sortMigrations(migrations);
  const applied = new Set(appliedIds);
  const known = new Set(sorted.map((migration) => migration.id));
  const pending = sorted.filter((migration) => !applied.has(migration.id));
  const newestAppliedId = [...applied].sort().at(-1);

  return {
    pending,
    unknownAppliedIds: [...applied].filter((id) => !known.has(id)).sort(),
    outOfOrderIds:
      newestAppliedId === undefined
        ? []
        : pending.map((migration) => migration.id).filter((id) => id < newestAppliedId),
  };
}
