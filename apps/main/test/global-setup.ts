import process from "node:process";
import { MongoMemoryServer } from "mongodb-memory-server";

export default async () => {
  // This runs once before all test suites
  // Example: start test database server
  const mongod = await MongoMemoryServer.create();
  process.env.OPEN_DPP_MONGODB_URI = mongod.getUri();

  // Store the instance for teardown
  (globalThis as any).__MONGOD__ = mongod;
};
