import type { Connection, Model } from "mongoose";
import { expect } from "@jest/globals";
import { ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../../../database/config";
import { UserRole } from "../../domain/user-role.enum";
import { User, UserSchema } from "./user.schema";

describe("userSchema", () => {
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let UserModel: Model<User>;
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
          { name: User.name, schema: UserSchema },
        ]),
      ],
    }).compile();
    mongoConnection = module.get<Connection>(getConnectionToken());
    UserModel = mongoConnection.model(User.name, UserSchema);
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
    await mongod.stop();
  });

  it("should create a user document", async () => {
    const userData = {
      _id: new ObjectId(),
      email: "test@example.com",
      emailVerified: true,
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      createdAt: new Date(),
      updatedAt: new Date(),
      role: UserRole.USER,
    };

    const user = new UserModel(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBe(userData._id);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.role).toBe(userData.role);
  });
});
