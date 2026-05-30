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

  afterAll(async () => {
    await module.close();
  });
});
