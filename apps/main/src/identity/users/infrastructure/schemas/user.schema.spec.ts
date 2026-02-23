import { expect } from "@jest/globals";
import { ObjectId } from "mongodb";
import { connect, Connection, Model } from "mongoose";
import { UserRole } from "../../domain/user-role.enum";
import { User, UserSchema } from "./user.schema";

describe("userSchema", () => {
  let mongoConnection: Connection;
  let UserModel: Model<User>;

  beforeAll(async () => {
    const uri = process.env.OPEN_DPP_MONGODB_URI!;
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
    await mongoConnection.close();
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
