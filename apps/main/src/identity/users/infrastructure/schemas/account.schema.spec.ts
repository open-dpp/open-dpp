import type { Connection, Model } from "mongoose";
import { expect } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../../../database/config";
import { Account, AccountSchema } from "./account.schema";

describe("accountSchema", () => {
  let mongoConnection: Connection;
  let AccountModel: Model<Account>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          { name: Account.name, schema: AccountSchema },
        ]),
      ],
    }).compile();
    mongoConnection = module.get<Connection>(getConnectionToken());
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
    await module.close();
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
