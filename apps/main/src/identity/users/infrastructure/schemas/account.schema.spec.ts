import { expect } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connect, Connection, Model } from "mongoose";
import { Account, AccountSchema } from "./account.schema";

describe("accountSchema", () => {
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let AccountModel: Model<Account>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    AccountModel = mongoConnection.model(Account.name, AccountSchema);
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();
  });

  it("should create an account document", async () => {
    const accountData = {
      _id: "acc-123",
      userId: "user-123",
      accountId: "acc-123",
      providerId: "google",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const account = new AccountModel(accountData);
    const savedAccount = await account.save();

    expect(savedAccount._id).toBe(accountData._id);
    expect(savedAccount.userId).toBe(accountData.userId);
    expect(savedAccount.providerId).toBe(accountData.providerId);
  });

  it("should validate required fields", async () => {
    const account = new AccountModel({});

    let err: any;
    try {
      await account.save();
    }
    catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.userId).toBeDefined();
    expect(err.errors.accountId).toBeDefined();
    expect(err.errors.providerId).toBeDefined();
  });
});
