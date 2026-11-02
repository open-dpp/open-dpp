import type { INestApplication } from "@nestjs/common";
import type { App } from "supertest/types";
import { expect } from "@jest/globals";
import _ from "lodash";
import type { Migration } from "../src/migrations/domain/migration";

export function ignoreIds(plain: any) {
  return _.transform(plain, (result: Record<string, unknown>, value: unknown, key: string) => {
    if (key === "id") {
      result[key] = expect.any(String);
    } else if (_.isObject(value)) {
      result[key] = ignoreIds(value);
    } else if (_.isArray(value)) {
      result[key] = value.map((item) => ignoreIds(item));
    } else {
      result[key] = value;
    }
  });
}

export function getApp(app: INestApplication): App {
  return app.getHttpServer() as App;
}

/**
 * Migrations must be safe to rerun (see src/migrations/README.md). Runs `up()` twice and
 * expects the second run to leave the data captured by `snapshot` unchanged.
 */
export async function expectMigrationToBeIdempotent(
  migration: Pick<Migration, "up">,
  snapshot: () => Promise<unknown>,
): Promise<void> {
  await migration.up();
  const afterFirstRun = await snapshot();
  await migration.up();
  expect(await snapshot()).toEqual(afterFirstRun);
}
