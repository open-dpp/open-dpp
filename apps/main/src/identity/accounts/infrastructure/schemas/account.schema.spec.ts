import type { Connection, Model } from "mongoose";
import { expect } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Types } from "mongoose";
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
        MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
      ],
    }).compile();
    mongoConnection = module.get<Connection>(getConnectionToken());
    AccountModel = mongoConnection.model(Account.name, AccountSchema);
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await module.close();
  });

  it("stores _id and userId as ObjectId, matching Better Auth's persistence", async () => {
    const id = new Types.ObjectId();
    const userId = new Types.ObjectId();

    const account = new AccountModel({
      _id: id,
      userId,
      accountId: userId.toString(),
      providerId: "credential",
      password: "hashed-password",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const saved = await account.save();

    expect(saved._id).toBeInstanceOf(Types.ObjectId);
    expect(saved._id.equals(id)).toBe(true);
    expect(saved.userId).toBeInstanceOf(Types.ObjectId);
    expect((saved.userId as Types.ObjectId).equals(userId)).toBe(true);
    expect(saved.providerId).toBe("credential");
  });

  it("requires userId, accountId, and providerId", async () => {
    const account = new AccountModel({ _id: new Types.ObjectId() });

    let err: any;
    try {
      await account.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.userId).toBeDefined();
    expect(err.errors.accountId).toBeDefined();
    expect(err.errors.providerId).toBeDefined();
  });
});
