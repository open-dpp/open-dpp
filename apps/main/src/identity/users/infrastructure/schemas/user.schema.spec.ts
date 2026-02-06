import { expect } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connect, Connection, Model } from "mongoose";
import { UserRole } from "../../domain/user-role.enum";
import { User, UserSchema } from "./user.schema";

describe("userSchema", () => {
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let UserModel: Model<User>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
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
    await mongoConnection.close();
    await mongod.stop();
  });

  it("should create a user document", async () => {
    const userData = {
      _id: "user-123",
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

  it("should enforce unique email constraint", async () => {
    const userData = {
      _id: "user-1",
      email: "unique@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
      role: UserRole.USER,
    };
    await new UserModel(userData).save();

    const duplicateData = {
      _id: "user-2",
      email: "unique@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
      role: UserRole.USER,
    };

    let err: any;
    try {
      await new UserModel(duplicateData).save();
    }
    catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });
});
