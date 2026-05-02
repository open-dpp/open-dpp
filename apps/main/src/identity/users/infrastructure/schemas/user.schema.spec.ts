import type { Connection, Model } from "mongoose";
import { expect } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { ObjectId } from "mongodb";
import { generateMongoConfig } from "../../../../database/config";
import { UserRole } from "../../domain/user-role.enum";
import { User, UserSchema } from "./user.schema";

describe("userSchema", () => {
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
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
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

  it("stores and retrieves preferredLanguage", async () => {
    const userData = {
      _id: new ObjectId(),
      email: "lang@example.com",
      emailVerified: true,
      firstName: "Lang",
      lastName: "User",
      name: "Lang User",
      createdAt: new Date(),
      updatedAt: new Date(),
      role: UserRole.USER,
      preferredLanguage: "de",
    };

    const user = new UserModel(userData);
    const savedUser = await user.save();

    expect(savedUser.preferredLanguage).toBe("de");
  });

  it("defaults preferredLanguage to 'en' when not provided", async () => {
    const userData = {
      _id: new ObjectId(),
      email: "default-lang@example.com",
      emailVerified: true,
      firstName: "Default",
      lastName: "Lang",
      name: "Default Lang",
      createdAt: new Date(),
      updatedAt: new Date(),
      role: UserRole.USER,
    };

    const user = new UserModel(userData);
    const savedUser = await user.save();

    expect(savedUser.preferredLanguage).toBe("en");
  });

});
