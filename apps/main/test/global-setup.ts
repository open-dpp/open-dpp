import process from "node:process";
import { MongoMemoryReplSet } from "mongodb-memory-server";

export default async () => {
  const mongod = await MongoMemoryReplSet.create({
    replSet: {
      count: 1, // single node replica set is fine for transactions
      storageEngine: "wiredTiger", // required for transactions
    },
  });

  process.env.OPEN_DPP_MONGODB_URI = mongod.getUri();

  // Store the instance for teardown
  (globalThis as any).__MONGOD__ = mongod;
};
