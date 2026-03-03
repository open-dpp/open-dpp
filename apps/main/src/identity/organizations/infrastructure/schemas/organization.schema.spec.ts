import type { Connection, Model } from "mongoose";
import { expect } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { ObjectId } from "mongodb";
import { generateMongoConfig } from "../../../../database/config";
import { Organization, OrganizationSchema } from "./organization.schema";

describe("organizationSchema", () => {
  let mongoConnection: Connection;
  let OrganizationModel: Model<Organization>;
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
          { name: Organization.name, schema: OrganizationSchema },
        ]),
      ],
    }).compile();
    mongoConnection = module.get<Connection>(getConnectionToken());
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
    await module.close();
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
