import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { generateMongoConfig } from "../../database/config";
import {
  Organization as OrganizationSchemaClass,
  OrganizationSchema,
} from "../../identity/organizations/infrastructure/schemas/organization.schema";
import { expectMigrationToBeIdempotent } from "../../../test/utils.for.test";
import { AlignOrganizationSlugsMigration } from "./20261013162954-align-organization-slugs";

describe("AlignOrganizationSlugsMigration", () => {
  let module: TestingModule;
  let migration: AlignOrganizationSlugsMigration;
  let organizationModel: Model<OrganizationSchemaClass>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          { name: OrganizationSchemaClass.name, schema: OrganizationSchema },
        ]),
      ],
      providers: [AlignOrganizationSlugsMigration],
    }).compile();

    migration = module.get(AlignOrganizationSlugsMigration);
    organizationModel = module.get(getModelToken(OrganizationSchemaClass.name));
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await organizationModel.deleteMany({});
  });

  const insertOrganization = async (slug?: string): Promise<string> => {
    const _id = new ObjectId();
    await organizationModel.create({
      _id,
      name: "Org",
      slug: slug ?? _id.toHexString(),
      metadata: {},
      createdAt: new Date(),
    });
    return _id.toHexString();
  };

  const slugOf = async (id: string): Promise<string | undefined> => {
    const document = await organizationModel.findOne({ _id: new ObjectId(id) }).lean();
    return document?.slug;
  };

  it("sets the slug of every organization whose slug differs from its id", async () => {
    const legacyId = await insertOrganization("acme-gmbh");
    const otherLegacyId = await insertOrganization("ACME GmbH");
    const alignedId = await insertOrganization();

    await migration.up();

    expect(await slugOf(legacyId)).toBe(legacyId);
    expect(await slugOf(otherLegacyId)).toBe(otherLegacyId);
    expect(await slugOf(alignedId)).toBe(alignedId);
  });

  it("is idempotent", async () => {
    await insertOrganization("acme-gmbh");
    await insertOrganization();

    await expectMigrationToBeIdempotent(migration, () =>
      organizationModel.find().sort({ _id: 1 }).lean(),
    );
  });

  it("succeeds without organizations", async () => {
    await expect(migration.up()).resolves.toBeUndefined();
  });
});
