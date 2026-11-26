import type { Connection } from "mongoose";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { MEDIA_COLLECTION, MediaDbSchema } from "../../media/infrastructure/media.schema";
import { expectMigrationToBeIdempotent } from "../../../test/utils.for.test";
import { UniquePassportFieldMediaMigration } from "./20261118180926-unique-passport-field-media";

const PASSPORT_FIELD_INDEX_KEY = { uniqueProductIdentifier: 1, dataFieldId: 1 };

describe("UniquePassportFieldMediaMigration", () => {
  let module: TestingModule;
  let migration: UniquePassportFieldMediaMigration;
  let connection: Connection;

  beforeAll(async () => {
    // No media model is registered: its automatic index build would race the duplicates
    // these tests insert.
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
      ],
      providers: [UniquePassportFieldMediaMigration],
    }).compile();

    migration = module.get(UniquePassportFieldMediaMigration);
    connection = module.get(getConnectionToken());
  });

  afterAll(async () => {
    await module.close();
  });

  const media = () => connection.collection(MEDIA_COLLECTION);

  beforeEach(async () => {
    // Indexes outlive `deleteMany`, so every test starts without the collection.
    const existing = await connection.db!.listCollections({ name: MEDIA_COLLECTION }).toArray();
    if (existing.length > 0) {
      await media().drop();
    }
  });

  const insertMedia = async (
    _id: string,
    uniqueProductIdentifier: string | null,
    dataFieldId: string | null,
  ) => {
    await media().insertOne({
      // @ts-expect-error media ids are UUID strings, not ObjectIds
      _id,
      uniqueProductIdentifier,
      dataFieldId,
      bucket: "dpp",
      objectName: `product-passport-files/${uniqueProductIdentifier}/${dataFieldId}-${_id}`,
    });
  };

  const idsOf = async (filter: object = {}) =>
    (await media().find(filter).sort({ _id: 1 }).toArray()).map((document) => document._id);

  const passportFieldIndex = async () =>
    (await media().indexes()).find(
      (index) => JSON.stringify(index.key) === JSON.stringify(PASSPORT_FIELD_INDEX_KEY),
    );

  it("keeps the media with the lowest id of each passport field and removes the others", async () => {
    await insertMedia("b", "upi-1", "manual");
    await insertMedia("a", "upi-1", "manual");
    await insertMedia("c", "upi-1", "manual");
    await insertMedia("d", "upi-1", "photo");
    await insertMedia("f", "upi-2", "manual");
    await insertMedia("e", "upi-2", "manual");

    await migration.up();

    expect(await idsOf({ uniqueProductIdentifier: "upi-1", dataFieldId: "manual" })).toEqual(["a"]);
    expect(await idsOf({ uniqueProductIdentifier: "upi-1", dataFieldId: "photo" })).toEqual(["d"]);
    expect(await idsOf({ uniqueProductIdentifier: "upi-2", dataFieldId: "manual" })).toEqual(["e"]);
  });

  it("leaves media without a passport field untouched", async () => {
    await insertMedia("library-1", null, null);
    await insertMedia("library-2", null, null);
    await media().insertOne({
      // @ts-expect-error media ids are UUID strings, not ObjectIds
      _id: "library-3",
      bucket: "dpp",
      objectName: "library-3",
    });
    await insertMedia("passport-only-1", "upi-1", null);
    await insertMedia("passport-only-2", "upi-1", null);

    await migration.up();

    expect(await idsOf()).toEqual([
      "library-1",
      "library-2",
      "library-3",
      "passport-only-1",
      "passport-only-2",
    ]);
    // The index does not cover them either.
    await insertMedia("library-4", null, null);
    await insertMedia("passport-only-3", "upi-1", null);
    expect(await media().countDocuments()).toBe(7);
  });

  it("creates the unique index of the passport field", async () => {
    await insertMedia("a", "upi-1", "manual");
    await insertMedia("b", "upi-1", "manual");

    await migration.up();

    expect(await passportFieldIndex()).toMatchObject({
      unique: true,
      partialFilterExpression: {
        uniqueProductIdentifier: { $type: "string" },
        dataFieldId: { $type: "string" },
      },
    });
    await expect(insertMedia("c", "upi-1", "manual")).rejects.toMatchObject({ code: 11000 });
  });

  it("creates the index the media schema declares", async () => {
    await migration.up();

    // Compared without building anything: only the migration has created indexes.
    const schema = MediaDbSchema.clone().set("autoIndex", false).set("autoCreate", false);
    const model = connection.model(`media-${randomUUID()}`, schema, MEDIA_COLLECTION);
    const { toCreate, toDrop } = await model.diffIndexes();
    expect(toCreate).toEqual([{ organizationName: 1, sectors: 1 }]);
    expect(toDrop).toEqual([]);
    // Mongoose finds it in place when it builds the schema's indexes after the migration.
    await expect(model.createIndexes()).resolves.toBeUndefined();
  });

  it("creates the index after the automatic index build failed on duplicates", async () => {
    await insertMedia("a", "upi-1", "manual");
    await insertMedia("b", "upi-1", "manual");
    // At bootstrap, Mongoose may build the schema's indexes before the migrations run.
    const model = connection.model(`media-${randomUUID()}`, MediaDbSchema, MEDIA_COLLECTION);
    await expect(model.init()).rejects.toMatchObject({ code: 11000 });
    expect(await passportFieldIndex()).toBeUndefined();

    await migration.up();

    expect(await idsOf()).toEqual(["a"]);
    expect(await passportFieldIndex()).toMatchObject({ unique: true });
  });

  it("is idempotent", async () => {
    await insertMedia("b", "upi-1", "manual");
    await insertMedia("a", "upi-1", "manual");
    await insertMedia("library-1", null, null);

    await expectMigrationToBeIdempotent(migration, async () => ({
      media: await media().find().sort({ _id: 1 }).toArray(),
      indexes: await media().indexes(),
    }));
  });

  it("succeeds without media", async () => {
    await expect(migration.up()).resolves.toBeUndefined();
    expect(await passportFieldIndex()).toMatchObject({ unique: true });
  });
});
