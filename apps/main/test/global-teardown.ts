import { MongoMemoryServer } from "mongodb-memory-server";

export default async () => {
  console.log("Global teardown running...");
  // This runs once after all test suites
  // Example: stop test database server
  const mongod: MongoMemoryServer = (globalThis as any).__MONGOD__;
  if (mongod) {
    await mongod.stop();
    console.log("MongoDB Memory Server stopped");
  }
};
