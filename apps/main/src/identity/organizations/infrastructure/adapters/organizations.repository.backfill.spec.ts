import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { generateMongoConfig } from "../../../../database/config";
import { AUTH } from "../../../auth/auth.provider";
import {
  Organization as OrganizationSchemaClass,
  OrganizationSchema,
} from "../schemas/organization.schema";
import { OrganizationsRepository } from "./organizations.repository";

describe("OrganizationsRepository slug backfill", () => {
  let module: TestingModule;
  let repository: OrganizationsRepository;
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
      providers: [OrganizationsRepository, { provide: AUTH, useValue: { api: {} } }],
    }).compile();

    repository = module.get(OrganizationsRepository);
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

    const aligned = await repository.alignSlugsWithIds();

    expect(aligned).toBe(2);
    expect(await slugOf(legacyId)).toBe(legacyId);
    expect(await slugOf(otherLegacyId)).toBe(otherLegacyId);
    expect(await slugOf(alignedId)).toBe(alignedId);
  });

  it("is idempotent", async () => {
    await insertOrganization("acme-gmbh");
    await repository.alignSlugsWithIds();

    expect(await repository.alignSlugsWithIds()).toBe(0);
  });

  it("reports zero without organizations", async () => {
    expect(await repository.alignSlugsWithIds()).toBe(0);
  });
});
