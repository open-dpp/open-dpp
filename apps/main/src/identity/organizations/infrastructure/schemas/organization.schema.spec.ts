import { expect } from "@jest/globals";
import { ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connect, Connection, Model } from "mongoose";
import { Organization, OrganizationSchema } from "./organization.schema";

describe("organizationSchema", () => {
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let OrganizationModel: Model<Organization>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    OrganizationModel = mongoConnection.model(Organization.name, OrganizationSchema);
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

  it("should create an organization document", async () => {
    const orgData = {
      _id: new ObjectId(),
      name: "Test Org",
      slug: "test-org",
      createdAt: new Date(),
      metadata: { key: "value" },
    };

    const org = new OrganizationModel(orgData);
    const savedOrg = await org.save();

    expect(savedOrg._id).toBe(orgData._id);
    expect(savedOrg.name).toBe(orgData.name);
    expect(savedOrg.slug).toBe(orgData.slug);
  });
});
