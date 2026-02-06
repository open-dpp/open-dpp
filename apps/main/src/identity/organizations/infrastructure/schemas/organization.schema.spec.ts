import { expect } from "@jest/globals";
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
      _id: "org-123",
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

  it("should enforce unique slug", async () => {
    const orgData = {
      _id: "org-1",
      name: "Test Org 1",
      slug: "unique-slug",
      createdAt: new Date(),
    };
    await new OrganizationModel(orgData).save();

    const duplicateData = {
      _id: "org-2",
      name: "Test Org 2",
      slug: "unique-slug",
      createdAt: new Date(),
    };

    let err: any;
    try {
      await new OrganizationModel(duplicateData).save();
    }
    catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });
});
