import { MongoMemoryServer } from "mongodb-memory-server";

export default async () => {
  const mongod: MongoMemoryServer = (globalThis as any).__MONGOD__;
  if (mongod) {
    await mongod.stop();
  }
};
