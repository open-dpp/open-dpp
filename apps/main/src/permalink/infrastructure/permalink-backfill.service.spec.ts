import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { getConnectionToken, getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { PresentationReferenceType } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import type { Connection } from "mongoose";

import { AasModule } from "../../aas/aas.module";
import { Environment } from "../../aas/domain/environment";
import { generateMongoConfig } from "../../database/config";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../passports/infrastructure/passport.schema";
import { PresentationConfiguration } from "../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { UniqueProductIdentifierRepository } from "../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { PermalinkRepository } from "./permalink.repository";
import { PermalinkBackfillService } from "./permalink-backfill.service";
import { UpiBackfillService } from "../../unique-product-identifier/infrastructure/upi-backfill.service";
import { PermalinkDoc, PermalinkSchema } from "./permalink.schema";

describe("Slice 25.1 — Backfill services", () => {
  let _permalinkRepository: PermalinkRepository;
  let permalinkBackfillService: PermalinkBackfillService;
  let upiBackfillService: UpiBackfillService;
  let passportRepository: PassportRepository;
  let presentationConfigurationRepository: PresentationConfigurationRepository;
  let _uniqueProductIdentifierRepository: UniqueProductIdentifierRepository;
  let connection: Connection;
  let module: TestingModule;

  // Helper: create & persist a passport
  async function seedPassport(organizationId: string): Promise<Passport> {
    const passport = Passport.create({
      organizationId,
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      }),
    });
    return passportRepository.save(passport);
  }

  // Helper: create & persist a presentation config linked to a passport
  async function seedConfig(
    passportId: string,
    organizationId: string,
  ): Promise<PresentationConfiguration> {
    const config = PresentationConfiguration.create({
      organizationId,
      referenceId: passportId,
      referenceType: PresentationReferenceType.Passport,
    });
    return presentationConfigurationRepository.save(config);
  }

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
        AasModule,
        MongooseModule.forFeature([
          { name: PermalinkDoc.name, schema: PermalinkSchema },
          { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
          { name: PassportDoc.name, schema: PassportSchema },
          { name: UniqueProductIdentifierDoc.name, schema: UniqueProductIdentifierSchema },
        ]),
      ],
      providers: [
        PermalinkRepository,
        PresentationConfigurationRepository,
        PassportRepository,
        UniqueProductIdentifierRepository,
        PermalinkBackfillService,
        UpiBackfillService,
      ],
    }).compile();

    _permalinkRepository = module.get(PermalinkRepository);
    permalinkBackfillService = module.get(PermalinkBackfillService);
    upiBackfillService = module.get(UpiBackfillService);
    passportRepository = module.get(PassportRepository);
    presentationConfigurationRepository = module.get(PresentationConfigurationRepository);
    _uniqueProductIdentifierRepository = module.get(UniqueProductIdentifierRepository);
    connection = module.get<Connection>(getConnectionToken());
    await module.get(getModelToken(PermalinkDoc.name)).syncIndexes();
    await module.get(getModelToken(UniqueProductIdentifierDoc.name)).syncIndexes();
  });

  afterEach(async () => {
    await Promise.all([
      connection.collection("permalinkdocs").deleteMany({}),
      connection.collection("presentationconfigurationdocs").deleteMany({}),
      connection.collection("passports").deleteMany({}),
      connection.collection("uniqueproductidentifierdocs").deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await module.close();
  });

  describe("(a) backfills organizationId onto legacy permalinks from the owning passport", () => {
    it("sets organizationId on a legacy permalink that has none", async () => {
      const orgX = `org-x-${randomUUID().slice(0, 8)}`;
      const passport = await seedPassport(orgX);
      const config = await seedConfig(passport.id, orgX);

      // Insert a legacy permalink with no organizationId
      const legacyId = randomUUID();
      const now = new Date();
      await connection.collection("permalinks").insertOne({
        _id: legacyId as any,
        _schemaVersion: "1.2.0",
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        presentationConfigurationId: config.id,
        kind: "presentation",
        primary: false,
        createdAt: now,
        updatedAt: now,
        // organizationId intentionally absent
      });

      await permalinkBackfillService.run();

      const rawDoc = await connection.collection("permalinks").findOne({ _id: legacyId as any });
      expect(rawDoc?.organizationId).toBe(orgX);
    });
  });

  describe("(b) backfills organizationId onto legacy UPIs from the owning passport", () => {
    it("sets organizationId on a legacy UPI that has none", async () => {
      const orgX = `org-x-${randomUUID().slice(0, 8)}`;
      const passport = await seedPassport(orgX);

      // Insert a legacy UPI with no organizationId
      const legacyUpiId = randomUUID();
      const now = new Date();
      await connection.collection("unique_product_identifiers").insertOne({
        _id: legacyUpiId as any,
        _schemaVersion: "1.0.0",
        referenceId: passport.id,
        type: "OPEN_DPP_UUID",
        gtin: null,
        batch: null,
        serial: null,
        createdAt: now,
        updatedAt: now,
        // organizationId intentionally absent
      });

      await upiBackfillService.run();

      const rawDoc = await connection
        .collection("unique_product_identifiers")
        .findOne({ _id: legacyUpiId as any });
      expect(rawDoc?.organizationId).toBe(orgX);
    });
  });

  describe("(c) marks exactly one primary per passport (earliest presentation permalink)", () => {
    it("promotes the earliest presentation permalink to primary and keeps others non-primary", async () => {
      const orgX = `org-c-${randomUUID().slice(0, 8)}`;
      const passport = await seedPassport(orgX);
      const configA = await seedConfig(passport.id, orgX);
      const configB = await seedConfig(passport.id, orgX);

      const earlierDate = new Date("2024-02-10T10:00:00.000Z");
      const laterDate = new Date("2024-02-11T10:00:00.000Z");
      const idA = randomUUID();
      const idB = randomUUID();

      // Insert two legacy permalinks — neither primary
      await connection.collection("permalinks").insertMany([
        {
          _id: idA as any,
          _schemaVersion: "1.2.0",
          slug: null,
          baseUrl: null,
          publishedUrl: null,
          presentationConfigurationId: configA.id,
          organizationId: orgX,
          kind: "presentation",
          primary: false,
          createdAt: earlierDate,
          updatedAt: earlierDate,
        },
        {
          _id: idB as any,
          _schemaVersion: "1.2.0",
          slug: null,
          baseUrl: null,
          publishedUrl: null,
          presentationConfigurationId: configB.id,
          organizationId: orgX,
          kind: "presentation",
          primary: false,
          createdAt: laterDate,
          updatedAt: laterDate,
        },
      ] as any);

      await permalinkBackfillService.run();

      const rawA = await connection.collection("permalinks").findOne({ _id: idA as any });
      const rawB = await connection.collection("permalinks").findOne({ _id: idB as any });

      // Earliest (idA) should be primary
      expect(rawA?.primary).toBe(true);
      expect(rawB?.primary).toBe(false);
    });
  });

  describe("(d) is idempotent", () => {
    it("running the backfill twice leaves no doc changed on the second pass", async () => {
      const orgX = `org-d-${randomUUID().slice(0, 8)}`;
      const passport = await seedPassport(orgX);
      const config = await seedConfig(passport.id, orgX);

      const legacyId = randomUUID();
      const now = new Date();
      await connection.collection("permalinks").insertOne({
        _id: legacyId as any,
        _schemaVersion: "1.2.0",
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        presentationConfigurationId: config.id,
        kind: "presentation",
        primary: false,
        createdAt: now,
        updatedAt: now,
        // organizationId intentionally absent
      });

      // First run
      await permalinkBackfillService.run();
      const afterFirst = await connection
        .collection("permalinks")
        .findOne({ _id: legacyId as any });
      const updatedAtAfterFirst = afterFirst?.updatedAt;

      // Second run — should be a no-op (organizationId already set)
      await permalinkBackfillService.run();
      const afterSecond = await connection
        .collection("permalinks")
        .findOne({ _id: legacyId as any });

      expect(afterSecond?.organizationId).toBe(orgX);
      // updatedAt should not change on the second pass
      expect(afterSecond?.updatedAt?.toISOString()).toBe(
        (updatedAtAfterFirst as Date)?.toISOString?.(),
      );
    });

    it("running the UPI backfill twice leaves no doc changed on the second pass", async () => {
      const orgX = `org-d2-${randomUUID().slice(0, 8)}`;
      const passport = await seedPassport(orgX);

      const legacyUpiId = randomUUID();
      const now = new Date();
      await connection.collection("unique_product_identifiers").insertOne({
        _id: legacyUpiId as any,
        _schemaVersion: "1.0.0",
        referenceId: passport.id,
        type: "OPEN_DPP_UUID",
        gtin: null,
        batch: null,
        serial: null,
        createdAt: now,
        updatedAt: now,
        // organizationId intentionally absent
      });

      // First run
      await upiBackfillService.run();
      const afterFirst = await connection
        .collection("unique_product_identifiers")
        .findOne({ _id: legacyUpiId as any });
      const updatedAtAfterFirst = afterFirst?.updatedAt;

      // Second run — no-op
      await upiBackfillService.run();
      const afterSecond = await connection
        .collection("unique_product_identifiers")
        .findOne({ _id: legacyUpiId as any });

      expect(afterSecond?.organizationId).toBe(orgX);
      expect(afterSecond?.updatedAt?.toISOString()).toBe(
        (updatedAtAfterFirst as Date)?.toISOString?.(),
      );
    });
  });

  describe("(e) leaves a row whose passport is missing untouched", () => {
    it("skips a permalink whose config references a non-existent passport", async () => {
      const _orphanConfigId = randomUUID();
      const orphanPassportId = randomUUID(); // no passport created with this ID

      // Insert a config referencing the non-existent passport
      const orphanConfig = PresentationConfiguration.create({
        organizationId: "org-orphan",
        referenceId: orphanPassportId,
        referenceType: PresentationReferenceType.Passport,
      });
      await presentationConfigurationRepository.save(orphanConfig);

      const orphanPermalinkId = randomUUID();
      const now = new Date();
      await connection.collection("permalinks").insertOne({
        _id: orphanPermalinkId as any,
        _schemaVersion: "1.2.0",
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        presentationConfigurationId: orphanConfig.id,
        kind: "presentation",
        primary: false,
        createdAt: now,
        updatedAt: now,
        // organizationId intentionally absent
      });

      // Should not throw
      await expect(permalinkBackfillService.run()).resolves.not.toThrow();

      // The orphan permalink's organizationId should remain null/absent
      const rawDoc = await connection
        .collection("permalinks")
        .findOne({ _id: orphanPermalinkId as any });
      expect(rawDoc?.organizationId ?? null).toBeNull();
    });

    it("skips a UPI whose passport is missing", async () => {
      const orphanPassportId = randomUUID(); // no passport created

      const orphanUpiId = randomUUID();
      const now = new Date();
      await connection.collection("unique_product_identifiers").insertOne({
        _id: orphanUpiId as any,
        _schemaVersion: "1.0.0",
        referenceId: orphanPassportId,
        type: "OPEN_DPP_UUID",
        gtin: null,
        batch: null,
        serial: null,
        createdAt: now,
        updatedAt: now,
        // organizationId intentionally absent
      });

      // Should not throw
      await expect(upiBackfillService.run()).resolves.not.toThrow();

      // The orphan UPI's organizationId should remain null/absent
      const rawDoc = await connection
        .collection("unique_product_identifiers")
        .findOne({ _id: orphanUpiId as any });
      expect(rawDoc?.organizationId ?? null).toBeNull();
    });
  });
});
