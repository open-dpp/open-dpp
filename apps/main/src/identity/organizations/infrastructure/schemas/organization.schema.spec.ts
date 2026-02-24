import { expect } from "@jest/globals";
import { ObjectId } from "mongodb";
import { connect, Connection, Model } from "mongoose";
import { Organization, OrganizationSchema } from "./organization.schema";

describe("organizationSchema", () => {
  let mongoConnection: Connection;
  let OrganizationModel: Model<Organization>;

  beforeAll(async () => {
    const uri = process.env.OPEN_DPP_MONGODB_URI!;
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
    await mongoConnection.close();
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

    expect(savedOrg._id.toString()).toBe(orgData._id.toString());
    expect(savedOrg.name).toBe(orgData.name);
    expect(savedOrg.slug).toBe(orgData.slug);
  });
});
