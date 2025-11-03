import { MongoMemoryServer } from "mongodb-memory-server";

export default async () => {
  console.log("Global setup running...");
  // This runs once before all test suites
  // Example: start test database server
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log(uri);
  process.env.OPEN_DPP_MONGODB_URI = uri;

  // Store the instance for teardown
  (globalThis as any).__MONGOD__ = mongod;
};
