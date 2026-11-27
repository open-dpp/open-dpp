import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Connection } from "mongoose";
import { generateMongoConfig } from "../../database/config";
import { expectMigrationToBeIdempotent } from "../../../test/utils.for.test";
import { DropUnusedMediaIndexMigration } from "./20261127142621-drop-unused-media-index";

const UNUSED_INDEX = "organizationName_1_sectors_1";
const PAGING_INDEX = "ownedByOrganizationId_1_createdAt_-1__id_-1";

describe("DropUnusedMediaIndexMigration", () => {
  let module: TestingModule;
  let migration: DropUnusedMediaIndexMigration;
  let connection: Connection;

  // The media schema is not registered on purpose: Mongoose would build its indexes in the
  // background and race the index assertions.
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
      ],
      providers: [DropUnusedMediaIndexMigration],
    }).compile();

    migration = module.get(DropUnusedMediaIndexMigration);
    connection = module.get(getConnectionToken());
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await connection.dropDatabase();
  });

  const media = () => connection.collection("media");

  const indexNames = async (): Promise<string[]> => {
    const indexes = await media().indexes();
    return indexes.map((index) => index.name ?? "").sort();
  };

  /** A media collection as a release before this migration leaves it. */
  const createMediaCollectionWithUnusedIndex = async () => {
    await media().insertOne({ title: "manual.pdf", ownedByOrganizationId: "org-1" });
    await media().createIndex({ organizationName: 1, sectors: 1 });
    await media().createIndex({ ownedByOrganizationId: 1, createdAt: -1, _id: -1 });
  };

  it("drops the index on organizationName and sectors and keeps the others", async () => {
    await createMediaCollectionWithUnusedIndex();
    expect(await indexNames()).toContain(UNUSED_INDEX);

    await migration.up();

    expect(await indexNames()).toEqual(["_id_", PAGING_INDEX].sort());
    expect(await media().countDocuments()).toBe(1);
  });

  it("is idempotent", async () => {
    await createMediaCollectionWithUnusedIndex();

    await expectMigrationToBeIdempotent(migration, indexNames);
  });

  it("succeeds when the index is already gone", async () => {
    await media().insertOne({ title: "manual.pdf", ownedByOrganizationId: "org-1" });

    await expect(migration.up()).resolves.toBeUndefined();
    expect(await indexNames()).toEqual(["_id_"]);
  });

  it("succeeds without a media collection", async () => {
    await expect(migration.up()).resolves.toBeUndefined();
  });
});
