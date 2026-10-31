import type { TestProject } from "vitest/node";
import { MongoMemoryReplSet } from "mongodb-memory-server";

declare module "vitest" {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

/**
 * Starts one MongoMemoryReplSet for the whole run. Spec files read its URI through
 * `inject("mongoUri")` in `test/setup-file.ts`; each spec file still gets its own database
 * (see `generateMongoConfig`). Runs in the main process before any test worker exists.
 */
export default async function setup(project: TestProject) {
  const mongod = await MongoMemoryReplSet.create({
    replSet: {
      count: 1, // single node replica set is fine for transactions
      storageEngine: "wiredTiger", // required for transactions
    },
  });
  project.provide("mongoUri", mongod.getUri());

  return async () => {
    await mongod.stop();
  };
}
