import type { TestingModule } from "@nestjs/testing";
import type { Model } from "mongoose";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { v4 as uuid4 } from "uuid";
import { generateMongoConfig } from "../../database/config";
import { TraceabilityEventsModule } from "../../traceability-events/traceability-events.module";
import { UniqueProductIdentifier } from "../domain/unique.product.identifier";
import { ExternalIdentifierType } from "../presentation/dto/unique-product-identifier-dto.schema";
import { UniqueProductIdentifierRepository } from "./unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
  UniqueProductIdentifierSchemaVersion,
} from "./unique-product-identifier.schema";

describe("uniqueProductIdentifierRepository", () => {
  let uniqueProductIdentifierRepository: UniqueProductIdentifierRepository;
  let uniqueProductIdentifierDoc: Model<UniqueProductIdentifierDoc>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        TraceabilityEventsModule,
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          {
            name: UniqueProductIdentifierDoc.name,
            schema: UniqueProductIdentifierSchema,
          },
        ]),
      ],
      providers: [UniqueProductIdentifierRepository],
    }).compile();
    uniqueProductIdentifierRepository = module.get<UniqueProductIdentifierRepository>(
      UniqueProductIdentifierRepository,
    );
    uniqueProductIdentifierDoc = module.get<Model<UniqueProductIdentifierDoc>>(
      getModelToken(UniqueProductIdentifierDoc.name),
    );
    // Build the partial unique index on (gtin, batch, serial) up front. Mongoose autoIndex
    // is async; under the full parallel suite the uniqueness tests below can otherwise run
    // before the index exists and see a duplicate insert succeed. Mirrors permalink.repository.spec.
    await uniqueProductIdentifierDoc.syncIndexes();
  });

  it("should create unique product identifier with external id", async () => {
    const referenceId = uuid4();
    const externalUUID = uuid4();
    const uniqueProductIdentifier = UniqueProductIdentifier.create({
      referenceId,
      externalUUID,
    });
    const { uuid } = await uniqueProductIdentifierRepository.save(uniqueProductIdentifier);
    const found = await uniqueProductIdentifierRepository.findOneOrFail(uuid);
    expect(found.referenceId).toEqual(referenceId);
  });

  it("fails if requested unique product identifier model could not be found", async () => {
    await expect(uniqueProductIdentifierRepository.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(UniqueProductIdentifier.name),
    );
  });

  it("should find all unique product identifiers with given referenced id", async () => {
    const referenceId = uuid4();
    const uniqueProductIdentifier1 = UniqueProductIdentifier.create({
      referenceId,
    });
    await uniqueProductIdentifierRepository.save(uniqueProductIdentifier1);
    const uniqueProductIdentifier2 = UniqueProductIdentifier.create({
      referenceId,
    });
    await uniqueProductIdentifierRepository.save(uniqueProductIdentifier2);
    const found = await uniqueProductIdentifierRepository.findAllByReferencedId(referenceId);
    expect(found).toContainEqual(uniqueProductIdentifier1);
    expect(found).toContainEqual(uniqueProductIdentifier2);
  });

  it("findOneByReferencedId returns newest UPI when multiple share referenceId", async () => {
    const referenceId = uuid4();
    const upi1 = UniqueProductIdentifier.create({ referenceId });
    await uniqueProductIdentifierRepository.save(upi1);
    await uniqueProductIdentifierDoc.updateOne(
      { _id: upi1.uuid },
      { $set: { createdAt: new Date(0) } },
    );
    const upi2 = UniqueProductIdentifier.create({ referenceId });
    await uniqueProductIdentifierRepository.save(upi2);
    const found = await uniqueProductIdentifierRepository.findOneByReferencedId(referenceId);
    expect(found).toBeDefined();
    expect(found!.uuid).toBe(upi2.uuid);
    const foundAgain = await uniqueProductIdentifierRepository.findOneByReferencedId(referenceId);
    expect(foundAgain!.uuid).toBe(found!.uuid);
  });

  it("delete upi by reference id", async () => {
    const referenceId = uuid4();
    const upi1 = UniqueProductIdentifier.create({ referenceId });
    await uniqueProductIdentifierRepository.save(upi1);
    await uniqueProductIdentifierRepository.deleteByReferenceId(referenceId);
    expect(
      await uniqueProductIdentifierRepository.findOneByReferencedId(referenceId),
    ).toBeUndefined();
  });

  it("deleteByReferenceIdAndType removes only the GS1 row and preserves the canonical OPEN_DPP_UUID", async () => {
    const referenceId = uuid4();
    const canonical = UniqueProductIdentifier.create({ referenceId });
    const gs1 = UniqueProductIdentifier.createGs1({ referenceId, gtin: "00012345678905" });
    await uniqueProductIdentifierRepository.save(canonical);
    await uniqueProductIdentifierRepository.save(gs1);

    await uniqueProductIdentifierRepository.deleteByReferenceIdAndType(
      referenceId,
      ExternalIdentifierType.GS1,
    );

    expect(
      await uniqueProductIdentifierRepository.findByReferenceIdAndType(
        referenceId,
        ExternalIdentifierType.GS1,
      ),
    ).toBeUndefined();
    const canonicalAfter = await uniqueProductIdentifierRepository.findByReferenceIdAndType(
      referenceId,
      ExternalIdentifierType.OPEN_DPP_UUID,
    );
    expect(canonicalAfter).toBeDefined();
    expect(canonicalAfter!.uuid).toBe(canonical.uuid);
  });

  it("deleteByReferenceIdAndType is a no-op when no row of that type exists", async () => {
    const referenceId = uuid4();
    const canonical = UniqueProductIdentifier.create({ referenceId });
    await uniqueProductIdentifierRepository.save(canonical);

    await expect(
      uniqueProductIdentifierRepository.deleteByReferenceIdAndType(
        referenceId,
        ExternalIdentifierType.GS1,
      ),
    ).resolves.toBeUndefined();
    const canonicalAfter = await uniqueProductIdentifierRepository.findByReferenceIdAndType(
      referenceId,
      ExternalIdentifierType.OPEN_DPP_UUID,
    );
    expect(canonicalAfter!.uuid).toBe(canonical.uuid);
  });

  it("defaults type to OPEN_DPP_UUID when create() omits it", async () => {
    const upi = UniqueProductIdentifier.create({ referenceId: uuid4() });
    expect(upi.type).toBe(ExternalIdentifierType.OPEN_DPP_UUID);
    const saved = await uniqueProductIdentifierRepository.save(upi);
    expect(saved.type).toBe(ExternalIdentifierType.OPEN_DPP_UUID);
  });

  it("persists and returns the explicit type discriminator", async () => {
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: uuid4(),
      gtin: "00075678164125",
    });
    const saved = await uniqueProductIdentifierRepository.save(upi);
    expect(saved.type).toBe(ExternalIdentifierType.GS1);
    const refetched = await uniqueProductIdentifierRepository.findOneOrFail(saved.uuid);
    expect(refetched.type).toBe(ExternalIdentifierType.GS1);
  });

  it("loads legacy rows missing the type field with the OPEN_DPP_UUID default", async () => {
    const upi = UniqueProductIdentifier.create({ referenceId: uuid4() });
    await uniqueProductIdentifierRepository.save(upi);
    await uniqueProductIdentifierDoc.updateOne({ _id: upi.uuid }, { $unset: { type: 1 } });

    const refetched = await uniqueProductIdentifierRepository.findOneOrFail(upi.uuid);
    expect(refetched.type).toBe(ExternalIdentifierType.OPEN_DPP_UUID);
  });

  it("persists and round-trips a GS1 UPI's normalized GTIN-14", async () => {
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: uuid4(),
      gtin: "4006381333931",
    });
    const saved = await uniqueProductIdentifierRepository.save(upi);
    expect(saved.type).toBe(ExternalIdentifierType.GS1);
    expect(saved.gs1).toEqual({ gtin: "04006381333931" });
    const refetched = await uniqueProductIdentifierRepository.findOneOrFail(saved.uuid);
    expect(refetched.gs1).toEqual({ gtin: "04006381333931" });
  });

  it("enforces global uniqueness of a bare GTIN across passports", async () => {
    const gtin = "00012345678905";
    await uniqueProductIdentifierRepository.save(
      UniqueProductIdentifier.createGs1({ referenceId: uuid4(), gtin }),
    );
    await expect(
      uniqueProductIdentifierRepository.save(
        UniqueProductIdentifier.createGs1({ referenceId: uuid4(), gtin }),
      ),
    ).rejects.toThrow();
  });

  it("does not let the GS1 uniqueness index collide OPEN_DPP_UUID rows (gtin null)", async () => {
    const referenceId = uuid4();
    await uniqueProductIdentifierRepository.save(UniqueProductIdentifier.create({ referenceId }));
    await uniqueProductIdentifierRepository.save(
      UniqueProductIdentifier.create({ referenceId: uuid4() }),
    );
    const found = await uniqueProductIdentifierRepository.findAllByReferencedId(referenceId);
    expect(found.length).toBe(1);
  });

  it("findByReferenceIdAndType resolves the canonical OPEN_DPP_UUID even when a GS1 UPI exists", async () => {
    const referenceId = uuid4();
    const canonical = UniqueProductIdentifier.create({ referenceId });
    await uniqueProductIdentifierRepository.save(canonical);
    const gs1 = UniqueProductIdentifier.createGs1({ referenceId, gtin: "00111111111117" });
    await uniqueProductIdentifierRepository.save(gs1);

    const resolved = await uniqueProductIdentifierRepository.findByReferenceIdAndType(
      referenceId,
      ExternalIdentifierType.OPEN_DPP_UUID,
    );
    expect(resolved).toBeDefined();
    expect(resolved!.uuid).toBe(canonical.uuid);
    expect(resolved!.type).toBe(ExternalIdentifierType.OPEN_DPP_UUID);

    const resolvedGs1 = await uniqueProductIdentifierRepository.findByReferenceIdAndType(
      referenceId,
      ExternalIdentifierType.GS1,
    );
    expect(resolvedGs1!.uuid).toBe(gs1.uuid);
  });

  it("findByReferenceIdAndType(OPEN_DPP_UUID) resolves a legacy row missing the type field", async () => {
    const referenceId = uuid4();
    const legacy = UniqueProductIdentifier.create({ referenceId });
    await uniqueProductIdentifierRepository.save(legacy);
    // Simulate a row persisted before the `type` field existed (schema v1.0.0):
    // Mongoose read-time defaults do NOT rewrite stored documents, so the DB row
    // has no `type` at all and an equality filter on OPEN_DPP_UUID would miss it.
    await uniqueProductIdentifierDoc.updateOne({ _id: legacy.uuid }, { $unset: { type: 1 } });

    const resolved = await uniqueProductIdentifierRepository.findByReferenceIdAndType(
      referenceId,
      ExternalIdentifierType.OPEN_DPP_UUID,
    );
    expect(resolved).toBeDefined();
    expect(resolved!.uuid).toBe(legacy.uuid);
    expect(resolved!.type).toBe(ExternalIdentifierType.OPEN_DPP_UUID);
  });

  it("findByReferenceIdAndType(GS1) ignores a legacy row missing the type field", async () => {
    const referenceId = uuid4();
    const legacy = UniqueProductIdentifier.create({ referenceId });
    await uniqueProductIdentifierRepository.save(legacy);
    await uniqueProductIdentifierDoc.updateOne({ _id: legacy.uuid }, { $unset: { type: 1 } });

    // The legacy-tolerance must NOT leak into the GS1 path: a type-less row is
    // canonical, never a GS1 match.
    const resolvedGs1 = await uniqueProductIdentifierRepository.findByReferenceIdAndType(
      referenceId,
      ExternalIdentifierType.GS1,
    );
    expect(resolvedGs1).toBeUndefined();
  });

  it("findByGs1Key resolves a bare-GTIN GS1 UPI for a normalized GTIN-14", async () => {
    const referenceId = uuid4();
    const gs1 = UniqueProductIdentifier.createGs1({ referenceId, gtin: "036000291452" });
    await uniqueProductIdentifierRepository.save(gs1);
    const found = await uniqueProductIdentifierRepository.findByGs1Key({ gtin: "00036000291452" });
    expect(found).toBeDefined();
    expect(found!.uuid).toBe(gs1.uuid);
    expect(found!.referenceId).toBe(referenceId);
    expect(
      await uniqueProductIdentifierRepository.findByGs1Key({ gtin: "00000040170725" }),
    ).toBeUndefined();
  });

  it("persists and round-trips a GS1 UPI's batch and serial", async () => {
    const gs1 = UniqueProductIdentifier.createGs1({
      referenceId: uuid4(),
      gtin: "88000000000107",
      batch: "LOT-42",
      serial: "SN-001",
    });
    const saved = await uniqueProductIdentifierRepository.save(gs1);
    expect(saved.gs1).toEqual({ gtin: "88000000000107", batch: "LOT-42", serial: "SN-001" });
    const refetched = await uniqueProductIdentifierRepository.findOneOrFail(saved.uuid);
    expect(refetched.gs1).toEqual({ gtin: "88000000000107", batch: "LOT-42", serial: "SN-001" });
  });

  it("allows two passports to share a GTIN when serials differ (distinct full keys)", async () => {
    const gtin = "88000000000206";
    const a = UniqueProductIdentifier.createGs1({
      referenceId: uuid4(),
      gtin,
      serial: "SN-A",
    });
    const b = UniqueProductIdentifier.createGs1({
      referenceId: uuid4(),
      gtin,
      serial: "SN-B",
    });
    await uniqueProductIdentifierRepository.save(a);
    await expect(uniqueProductIdentifierRepository.save(b)).resolves.toBeDefined();
  });

  it("rejects a duplicate full key (same gtin + batch + serial)", async () => {
    const shared = { gtin: "88000000000305", batch: "LOT-1", serial: "SN-1" };
    await uniqueProductIdentifierRepository.save(
      UniqueProductIdentifier.createGs1({ referenceId: uuid4(), ...shared }),
    );
    await expect(
      uniqueProductIdentifierRepository.save(
        UniqueProductIdentifier.createGs1({ referenceId: uuid4(), ...shared }),
      ),
    ).rejects.toThrow();
  });

  it("allows a bare GTIN and a serialized unit of the same GTIN to coexist", async () => {
    const gtin = "88000000000404";
    const bare = UniqueProductIdentifier.createGs1({ referenceId: uuid4(), gtin });
    const serialized = UniqueProductIdentifier.createGs1({
      referenceId: uuid4(),
      gtin,
      serial: "SN-X",
    });
    await uniqueProductIdentifierRepository.save(bare);
    await expect(uniqueProductIdentifierRepository.save(serialized)).resolves.toBeDefined();
  });

  it("findByGs1Key matches the exact key (bare GTIN does not resolve a serialized sibling)", async () => {
    const gtin = "88000000000503";
    const bare = UniqueProductIdentifier.createGs1({ referenceId: uuid4(), gtin });
    const serialized = UniqueProductIdentifier.createGs1({
      referenceId: uuid4(),
      gtin,
      serial: "SN-9",
    });
    await uniqueProductIdentifierRepository.save(bare);
    await uniqueProductIdentifierRepository.save(serialized);

    const foundBare = await uniqueProductIdentifierRepository.findByGs1Key({ gtin });
    expect(foundBare!.uuid).toBe(bare.uuid);

    const foundSerial = await uniqueProductIdentifierRepository.findByGs1Key({
      gtin,
      serial: "SN-9",
    });
    expect(foundSerial!.uuid).toBe(serialized.uuid);

    // a batch-keyed lookup on a key that was never stored resolves nothing
    expect(
      await uniqueProductIdentifierRepository.findByGs1Key({ gtin, batch: "LOT-NOPE" }),
    ).toBeUndefined();
  });

  it("findByGs1Key resolves a combined batch + serial key", async () => {
    const gtin = "88000000000602";
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: uuid4(),
      gtin,
      batch: "LOT-7",
      serial: "SN-7",
    });
    await uniqueProductIdentifierRepository.save(upi);
    const found = await uniqueProductIdentifierRepository.findByGs1Key({
      gtin,
      batch: "LOT-7",
      serial: "SN-7",
    });
    expect(found!.uuid).toBe(upi.uuid);
  });

  // Slice 24: organizationId + findAllByOrganizationId
  it("persists and loads organizationId on a UPI", async () => {
    const referenceId = uuid4();
    const orgId = uuid4();
    const upi = UniqueProductIdentifier.create({ referenceId, organizationId: orgId });
    const saved = await uniqueProductIdentifierRepository.save(upi);
    expect(saved.organizationId).toBe(orgId);
    const found = await uniqueProductIdentifierRepository.findOneOrFail(saved.uuid);
    expect(found.organizationId).toBe(orgId);
  });

  it("findAllByOrganizationId returns the org's UPIs (system + GS1) newest-first, excluding other orgs", async () => {
    const orgA = uuid4();
    const orgB = uuid4();
    const ref1 = uuid4();
    const ref2 = uuid4();
    const ref3 = uuid4();
    const upiA1 = UniqueProductIdentifier.create({ referenceId: ref1, organizationId: orgA });
    const upiA2 = UniqueProductIdentifier.createGs1({
      referenceId: ref2,
      organizationId: orgA,
      gtin: "00777777777779",
    });
    const upiB = UniqueProductIdentifier.create({ referenceId: ref3, organizationId: orgB });
    await uniqueProductIdentifierRepository.save(upiA1);
    // Ensure ordering: make upiA1 older
    await uniqueProductIdentifierDoc.updateOne(
      { _id: upiA1.uuid },
      { $set: { createdAt: new Date(Date.now() - 10000) } },
    );
    await uniqueProductIdentifierRepository.save(upiA2);
    await uniqueProductIdentifierRepository.save(upiB);

    const result = await uniqueProductIdentifierRepository.findAllByOrganizationId(orgA);
    const uuids = result.items.map((u) => u.uuid);
    expect(uuids).toContain(upiA1.uuid);
    expect(uuids).toContain(upiA2.uuid);
    expect(uuids).not.toContain(upiB.uuid);
    // newest-first: upiA2 should come before upiA1
    expect(uuids.indexOf(upiA2.uuid)).toBeLessThan(uuids.indexOf(upiA1.uuid));
  });

  it("findAllByOrganizationId paginates via cursor", async () => {
    const orgC = uuid4();
    const ref4 = uuid4();
    const ref5 = uuid4();
    const upiC1 = UniqueProductIdentifier.create({ referenceId: ref4, organizationId: orgC });
    const upiC2 = UniqueProductIdentifier.create({ referenceId: ref5, organizationId: orgC });
    await uniqueProductIdentifierRepository.save(upiC1);
    // Make upiC1 older so upiC2 is newest
    await uniqueProductIdentifierDoc.updateOne(
      { _id: upiC1.uuid },
      { $set: { createdAt: new Date(Date.now() - 20000) } },
    );
    await uniqueProductIdentifierRepository.save(upiC2);

    const page1 = await uniqueProductIdentifierRepository.findAllByOrganizationId(orgC, {
      pagination: { limit: 1 },
    });
    expect(page1.items).toHaveLength(1);
    expect(page1.pagination.cursor).not.toBeNull();
    // newest first, so page1 should have upiC2
    expect(page1.items[0].uuid).toBe(upiC2.uuid);

    const page2 = await uniqueProductIdentifierRepository.findAllByOrganizationId(orgC, {
      pagination: { limit: 1, cursor: page1.pagination.cursor! },
    });
    expect(page2.items).toHaveLength(1);
    expect(page2.items[0].uuid).toBe(upiC1.uuid);
    // No overlap
    expect(page2.items[0].uuid).not.toBe(page1.items[0].uuid);
  });

  // Slice 26 — UPI no-GS1-backfill regression (characterization test)
  // These tests pin existing read-time behaviour so future schema changes can't silently break it.
  // Expected GREEN on first run — no production code change required.
  describe("Slice 26 — no-GS1-backfill regression", () => {
    it("reads a legacy UPI doc with no gtin/batch/serial as a canonical OPEN_DPP_UUID identity with null GS1 fields", async () => {
      const legacyUuid = uuid4();
      const legacyReferenceId = uuid4();
      // Insert a raw legacy doc bypassing Mongoose validation (simulates a v1.0.0 row
      // written before the type/gtin fields existed).
      const legacyDoc = new uniqueProductIdentifierDoc({
        _id: legacyUuid,
        _schemaVersion: UniqueProductIdentifierSchemaVersion.v1_0_0,
        referenceId: legacyReferenceId,
        // Deliberately omit: type, gtin, batch, serial
      });
      await legacyDoc.save({ validateBeforeSave: false });

      const found = await uniqueProductIdentifierRepository.findOne(legacyUuid);
      expect(found).toBeDefined();
      expect(found!.type).toBe(ExternalIdentifierType.OPEN_DPP_UUID);
      expect(found!.gs1).toBeUndefined();
      // toPlain() should carry null for GS1 fields
      const plain = found!.toPlain();
      expect(plain.gtin).toBeNull();
      expect(plain.batch).toBeNull();
      expect(plain.serial).toBeNull();
    });

    it("reading a legacy UPI doc does not rewrite the stored doc (_schemaVersion stays 1.0.0, gtin stays absent)", async () => {
      const legacyUuid = uuid4();
      const legacyReferenceId = uuid4();
      const legacyDoc = new uniqueProductIdentifierDoc({
        _id: legacyUuid,
        _schemaVersion: UniqueProductIdentifierSchemaVersion.v1_0_0,
        referenceId: legacyReferenceId,
        // Deliberately omit: type, gtin, batch, serial
      });
      await legacyDoc.save({ validateBeforeSave: false });

      // Read through the repository (triggers convertToDomain, no storage write)
      await uniqueProductIdentifierRepository.findOne(legacyUuid);

      // Now verify the raw stored document is unchanged
      const rawDoc = await uniqueProductIdentifierDoc.findById(legacyUuid).lean();
      expect(rawDoc?._schemaVersion).toBe(UniqueProductIdentifierSchemaVersion.v1_0_0);
      // gtin should still be absent (or null if the schema default injected it)
      // What matters: it was NOT mutated to something unexpected by the read
      expect(rawDoc?.gtin ?? null).toBeNull();
    });
  });

  describe("findAllByReferencedIdPaginated (passport-scoped, paginated)", () => {
    it("returns a passport's UPIs (system + GS1) newest-first, excluding other passports", async () => {
      const passportA = uuid4();
      const passportB = uuid4();
      const system = UniqueProductIdentifier.create({
        referenceId: passportA,
        organizationId: uuid4(),
      });
      const gs1 = UniqueProductIdentifier.createGs1({
        referenceId: passportA,
        organizationId: uuid4(),
        gtin: "00999999999993",
      });
      const other = UniqueProductIdentifier.create({ referenceId: passportB });
      await uniqueProductIdentifierRepository.save(system);
      // Make the system row older so the GS1 row is newest.
      await uniqueProductIdentifierDoc.updateOne(
        { _id: system.uuid },
        { $set: { createdAt: new Date(Date.now() - 10000) } },
      );
      await uniqueProductIdentifierRepository.save(gs1);
      await uniqueProductIdentifierRepository.save(other);

      const result =
        await uniqueProductIdentifierRepository.findAllByReferencedIdPaginated(passportA);
      const uuids = result.items.map((u) => u.uuid);
      expect(uuids).toContain(system.uuid);
      expect(uuids).toContain(gs1.uuid);
      expect(uuids).not.toContain(other.uuid);
      // newest-first: gs1 (newer) before system (older)
      expect(uuids.indexOf(gs1.uuid)).toBeLessThan(uuids.indexOf(system.uuid));
    });

    it("paginates a passport's UPIs via cursor (no overlap, no loss)", async () => {
      const passport = uuid4();
      const u1 = UniqueProductIdentifier.create({ referenceId: passport });
      const u2 = UniqueProductIdentifier.create({ referenceId: passport });
      await uniqueProductIdentifierRepository.save(u1);
      await uniqueProductIdentifierDoc.updateOne(
        { _id: u1.uuid },
        { $set: { createdAt: new Date(Date.now() - 20000) } },
      );
      await uniqueProductIdentifierRepository.save(u2);

      const page1 = await uniqueProductIdentifierRepository.findAllByReferencedIdPaginated(
        passport,
        { pagination: { limit: 1 } },
      );
      expect(page1.items).toHaveLength(1);
      expect(page1.pagination.cursor).not.toBeNull();
      expect(page1.items[0].uuid).toBe(u2.uuid); // newest first

      const page2 = await uniqueProductIdentifierRepository.findAllByReferencedIdPaginated(
        passport,
        { pagination: { limit: 1, cursor: page1.pagination.cursor! } },
      );
      expect(page2.items).toHaveLength(1);
      expect(page2.items[0].uuid).toBe(u1.uuid);
      expect(page2.items[0].uuid).not.toBe(page1.items[0].uuid);
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
