import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { getConnectionToken, getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { DigitalProductDocumentTypes } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import type { Connection } from "mongoose";

import { generateMongoConfig } from "../../database/config";
import { PresentationConfiguration } from "../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { Permalink } from "../domain/permalink";
import { PermalinkRepository } from "./permalink.repository";
import { PermalinkDoc, PermalinkDocVersion, PermalinkSchema } from "./permalink.schema";

describe("PermalinkRepository", () => {
  let repository: PermalinkRepository;
  let presentationConfigurationRepository: PresentationConfigurationRepository;
  let connection: Connection;
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
          { name: PermalinkDoc.name, schema: PermalinkSchema },
          { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
        ]),
      ],
      providers: [PermalinkRepository, PresentationConfigurationRepository],
    }).compile();

    repository = module.get(PermalinkRepository);
    presentationConfigurationRepository = module.get(PresentationConfigurationRepository);
    connection = module.get<Connection>(getConnectionToken());
    await module.get(getModelToken(PermalinkDoc.name)).syncIndexes();
  });

  afterEach(async () => {
    await Promise.all([
      connection.collection("permalinkdocs").deleteMany({}),
      connection.collection("presentationconfigurationdocs").deleteMany({}),
    ]);
  });

  // Slice 25: schema-version bump + migrate-on-read backfill

  describe("Slice 25 — schema version 1.3.0 + migrate-on-read", () => {
    it("saves a permalink at the latest schema version (1.3.0) with primary defaulted false and GS1 fields null/absent", async () => {
      const permalink = Permalink.create({ presentationConfigurationId: randomUUID() });
      await repository.save(permalink);

      const rawDoc = await connection
        .collection("permalinks")
        .findOne({ _id: permalink.id as any });
      expect(rawDoc?._schemaVersion).toBe(PermalinkDocVersion.v1_3_0);
      // Permalink.create defaults primary to false; just check GS1 fields null or absent
      expect(rawDoc?.primary).toBe(false);
      expect(rawDoc?.uniqueProductIdentifierId ?? null).toBeNull();
      expect(rawDoc?.gs1DataAttributes ?? null).toBeNull();
    });

    it("migrates a legacy permalink (1.2.0, no primary/GS1 fields) to primary=false with null GS1 fields on findOneOrFail", async () => {
      const legacyId = randomUUID();
      const legacyPresentationConfigId = randomUUID();
      const now = new Date();
      // Insert raw legacy doc with _schemaVersion 1.2.0, no primary/GS1 fields
      await connection.collection("permalinks").insertOne({
        _id: legacyId as any,
        _schemaVersion: "1.2.0",
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        presentationConfigurationId: legacyPresentationConfigId,
        organizationId: null,
        kind: "presentation",
        createdAt: now,
        updatedAt: now,
      });

      const found = await repository.findOneOrFail(legacyId);

      // Per-doc migration: primary ?? false, GS1 fields null
      expect(found.primary).toBe(false);
      expect(found.uniqueProductIdentifierId).toBeNull();
      expect(found.gs1DataAttributes).toBeNull();
    });

    it("migration is idempotent on read (raw stored _schemaVersion is still 1.2.0 after two reads)", async () => {
      const legacyId = randomUUID();
      const legacyPresentationConfigId = randomUUID();
      const now = new Date();
      await connection.collection("permalinks").insertOne({
        _id: legacyId as any,
        _schemaVersion: "1.2.0",
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        presentationConfigurationId: legacyPresentationConfigId,
        organizationId: null,
        kind: "presentation",
        createdAt: now,
        updatedAt: now,
      });

      const first = await repository.findOneOrFail(legacyId);
      const second = await repository.findOneOrFail(legacyId);

      // Both reads yield the same result
      expect(first.primary).toBe(second.primary);

      // Raw stored _schemaVersion is still 1.2.0 — read-time migration doesn't rewrite storage
      const rawDoc = await connection.collection("permalinks").findOne({ _id: legacyId as any });
      expect(rawDoc?._schemaVersion).toBe("1.2.0");
    });

    it("persists the upgrade when a migrated legacy permalink is saved", async () => {
      const legacyId = randomUUID();
      const legacyPresentationConfigId = randomUUID();
      const now = new Date();
      await connection.collection("permalinks").insertOne({
        _id: legacyId as any,
        _schemaVersion: "1.2.0",
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        presentationConfigurationId: legacyPresentationConfigId,
        organizationId: null,
        kind: "presentation",
        createdAt: now,
        updatedAt: now,
      });

      // Read (migrates in-memory), then save
      const migrated = await repository.findOneOrFail(legacyId);
      await repository.save(migrated);

      // Raw stored _schemaVersion is now 1.3.0
      const rawDoc = await connection.collection("permalinks").findOne({ _id: legacyId as any });
      expect(rawDoc?._schemaVersion).toBe(PermalinkDocVersion.v1_3_0);
      expect(rawDoc?.primary).toBe(false);
      expect(rawDoc?.uniqueProductIdentifierId ?? null).toBeNull();
      expect(rawDoc?.gs1DataAttributes ?? null).toBeNull();
    });

    it("a single legacy presentation permalink becomes primary via findAllByPassportId", async () => {
      const passportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      // Seed a config
      const config = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      await presentationConfigurationRepository.save(config);

      const legacyId = randomUUID();
      const now = new Date();
      // Insert legacy 1.2.0 doc with no primary field
      await connection.collection("permalinks").insertOne({
        _id: legacyId as any,
        _schemaVersion: "1.2.0",
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        presentationConfigurationId: config.id,
        organizationId,
        kind: "presentation",
        createdAt: now,
        updatedAt: now,
      });

      const all = await repository.findAllByPassportId(passportId);
      expect(all).toHaveLength(1);
      expect(all[0].primary).toBe(true);

      const primary = await repository.findPrimaryByPassportId(passportId);
      expect(primary?.id).toBe(legacyId);
    });

    it("a legacy passport with MULTIPLE presentation permalinks yields EXACTLY ONE primary", async () => {
      const passportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      // Seed two configs for one passport
      const configA = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      const configB = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      await presentationConfigurationRepository.save(configA);
      await presentationConfigurationRepository.save(configB);

      // Insert BOTH as raw legacy 1.2.0 docs (no primary field)
      // Make idA's createdAt earlier to ensure it wins (ties broken by _id, but dates differ here)
      const earlierDate = new Date("2024-01-10T12:00:00.000Z");
      const laterDate = new Date("2024-01-11T12:00:00.000Z");
      const idA = randomUUID();
      const idB = randomUUID();

      await connection.collection("permalinks").insertMany([
        {
          _id: idA as any,
          _schemaVersion: "1.2.0",
          slug: null,
          baseUrl: null,
          publishedUrl: null,
          presentationConfigurationId: configA.id,
          organizationId,
          kind: "presentation",
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
          organizationId,
          kind: "presentation",
          createdAt: laterDate,
          updatedAt: laterDate,
        },
      ] as any);

      // First read
      const allFirst = await repository.findAllByPassportId(passportId);
      expect(allFirst).toHaveLength(2);
      const primaryOnesFirst = allFirst.filter((p) => p.primary);
      expect(primaryOnesFirst).toHaveLength(1);
      expect(primaryOnesFirst[0].id).toBe(idA); // earliest createdAt wins

      const primaryFirst = await repository.findPrimaryByPassportId(passportId);
      expect(primaryFirst?.id).toBe(idA);

      // Second read — idempotent: same permalink stays primary
      const allSecond = await repository.findAllByPassportId(passportId);
      expect(allSecond.filter((p) => p.primary)).toHaveLength(1);
      expect(allSecond.find((p) => p.primary)?.id).toBe(idA);

      const primarySecond = await repository.findPrimaryByPassportId(passportId);
      expect(primarySecond?.id).toBe(idA);
    });

    it("loads a legacy permalink lacking organizationId without throwing", async () => {
      const legacyId = randomUUID();
      const legacyPresentationConfigId = randomUUID();
      const now = new Date();
      // Insert raw legacy doc with NO organizationId field
      await connection.collection("permalinks").insertOne({
        _id: legacyId as any,
        _schemaVersion: "1.2.0",
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        presentationConfigurationId: legacyPresentationConfigId,
        kind: "presentation",
        createdAt: now,
        updatedAt: now,
        // organizationId intentionally absent
      });

      const found = await repository.findOneOrFail(legacyId);
      expect(found.organizationId).toBeNull();
    });
  });

  describe("findPageByPassportId (passport-scoped union, paginated)", () => {
    it("returns BOTH presentation and gs1-link permalinks for the passport, excluding other passports", async () => {
      const passportId = randomUUID();
      const otherPassportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      // Presentation permalink for the passport (resolved via presentation-config join)
      const config = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      await presentationConfigurationRepository.save(config);
      const presentation = Permalink.create({
        presentationConfigurationId: config.id,
        organizationId,
      });
      await repository.save(presentation);

      // gs1-link permalink whose UPI belongs to the passport (resolved via UPI join)
      const upiId = randomUUID();
      await connection
        .collection("unique_product_identifiers")
        .insertOne({ _id: upiId as any, referenceId: passportId });
      const gs1Link = Permalink.create({
        kind: "gs1-link",
        uniqueProductIdentifierId: upiId,
        presentationConfigurationId: null,
        organizationId,
      });
      await repository.save(gs1Link);

      // Control: presentation permalink for a DIFFERENT passport
      const otherConfig = PresentationConfiguration.create({
        organizationId,
        referenceId: otherPassportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      await presentationConfigurationRepository.save(otherConfig);
      await repository.save(
        Permalink.create({ presentationConfigurationId: otherConfig.id, organizationId }),
      );

      // Control: gs1-link whose UPI belongs to a DIFFERENT passport
      const otherUpiId = randomUUID();
      await connection
        .collection("unique_product_identifiers")
        .insertOne({ _id: otherUpiId as any, referenceId: otherPassportId });
      await repository.save(
        Permalink.create({
          kind: "gs1-link",
          uniqueProductIdentifierId: otherUpiId,
          presentationConfigurationId: null,
          organizationId,
        }),
      );

      const result = await repository.findPageByPassportId(passportId);
      const ids = result.items.map((p) => p.id).sort();
      expect(ids).toEqual([presentation.id, gs1Link.id].sort());
    });

    it("returns empty (cursor null) when the passport has no permalinks", async () => {
      const result = await repository.findPageByPassportId(randomUUID());
      expect(result.items).toEqual([]);
      expect(result.pagination.cursor).toBeNull();
    });

    it("paginates the union via cursor (no overlap, no loss)", async () => {
      const passportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      const config = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      await presentationConfigurationRepository.save(config);
      const presentation = Permalink.create({
        presentationConfigurationId: config.id,
        organizationId,
        createdAt: new Date("2024-03-01T10:00:00.000Z"),
        updatedAt: new Date("2024-03-01T10:00:00.000Z"),
      });
      await repository.save(presentation);

      const upiId = randomUUID();
      await connection
        .collection("unique_product_identifiers")
        .insertOne({ _id: upiId as any, referenceId: passportId });
      const gs1Link = Permalink.create({
        kind: "gs1-link",
        uniqueProductIdentifierId: upiId,
        presentationConfigurationId: null,
        organizationId,
        createdAt: new Date("2024-03-02T10:00:00.000Z"),
        updatedAt: new Date("2024-03-02T10:00:00.000Z"),
      });
      await repository.save(gs1Link);

      const page1 = await repository.findPageByPassportId(passportId, {
        pagination: { limit: 1 },
      });
      expect(page1.items).toHaveLength(1);
      expect(page1.pagination.cursor).not.toBeNull();
      expect(page1.items[0].id).toBe(gs1Link.id); // newest first

      const page2 = await repository.findPageByPassportId(passportId, {
        pagination: { limit: 1, cursor: page1.pagination.cursor! },
      });
      expect(page2.items).toHaveLength(1);
      expect(page2.items[0].id).toBe(presentation.id);
      // Last page is exactly full (2 rows, limit 1) — only a limit+1 probe can tell
      // it apart from a page with a successor, and a non-null cursor here would
      // make a contract-following consumer page forever.
      expect(page2.pagination.cursor).toBeNull();

      const allIds = [page1.items[0].id, page2.items[0].id].sort();
      expect(allIds).toEqual([presentation.id, gs1Link.id].sort());
    });

    it("returns a null cursor on a partial last page", async () => {
      const passportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      const config = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      await presentationConfigurationRepository.save(config);
      await repository.save(
        Permalink.create({
          presentationConfigurationId: config.id,
          organizationId,
          createdAt: new Date("2024-04-01T10:00:00.000Z"),
          updatedAt: new Date("2024-04-01T10:00:00.000Z"),
        }),
      );

      for (const createdAt of [
        new Date("2024-04-02T10:00:00.000Z"),
        new Date("2024-04-03T10:00:00.000Z"),
      ]) {
        const upiId = randomUUID();
        await connection
          .collection("unique_product_identifiers")
          .insertOne({ _id: upiId as any, referenceId: passportId });
        await repository.save(
          Permalink.create({
            kind: "gs1-link",
            uniqueProductIdentifierId: upiId,
            presentationConfigurationId: null,
            organizationId,
            createdAt,
            updatedAt: createdAt,
          }),
        );
      }

      const page1 = await repository.findPageByPassportId(passportId, {
        pagination: { limit: 2 },
      });
      expect(page1.items).toHaveLength(2);
      expect(page1.pagination.cursor).not.toBeNull();

      const page2 = await repository.findPageByPassportId(passportId, {
        pagination: { limit: 2, cursor: page1.pagination.cursor! },
      });
      expect(page2.items).toHaveLength(1);
      expect(page2.pagination.cursor).toBeNull();
    });

    // The list view reads through this method while the public resolver reads
    // through findPrimaryByPassportId. Legacy docs (≤1.2.0) carry no `primary`
    // field, so without the D10 promotion the list shows zero primaries for a
    // passport the resolver happily resolves — the two disagree (PR #615 review).
    it("promotes the canonical primary for a legacy passport (single presentation permalink)", async () => {
      const passportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      const config = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      await presentationConfigurationRepository.save(config);

      const legacyId = randomUUID();
      const now = new Date();
      await connection.collection("permalinks").insertOne({
        _id: legacyId as any,
        _schemaVersion: "1.2.0",
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        presentationConfigurationId: config.id,
        organizationId,
        kind: "presentation",
        createdAt: now,
        updatedAt: now,
      });

      const page = await repository.findPageByPassportId(passportId);

      expect(page.items).toHaveLength(1);
      expect(page.items[0].primary).toBe(true);
      // ...and it is the same permalink the public resolver picks
      const resolved = await repository.findPrimaryByPassportId(passportId);
      expect(resolved?.id).toBe(legacyId);
    });

    // The canonical primary is the EARLIEST createdAt, but this method sorts
    // newest-first — so on a multi-page passport that row sits on the last page.
    // Normalizing per page would mint a different primary on every page.
    it("keeps exactly one primary across pages for a legacy passport, on the earliest row", async () => {
      const passportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      const configA = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      const configB = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      await presentationConfigurationRepository.save(configA);
      await presentationConfigurationRepository.save(configB);

      const earlierDate = new Date("2024-01-10T12:00:00.000Z");
      const laterDate = new Date("2024-01-11T12:00:00.000Z");
      const idA = randomUUID();
      const idB = randomUUID();

      await connection.collection("permalinks").insertMany([
        {
          _id: idA as any,
          _schemaVersion: "1.2.0",
          slug: null,
          baseUrl: null,
          publishedUrl: null,
          presentationConfigurationId: configA.id,
          organizationId,
          kind: "presentation",
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
          organizationId,
          kind: "presentation",
          createdAt: laterDate,
          updatedAt: laterDate,
        },
      ] as any);

      const page1 = await repository.findPageByPassportId(passportId, {
        pagination: { limit: 1 },
      });
      const page2 = await repository.findPageByPassportId(passportId, {
        pagination: { limit: 1, cursor: page1.pagination.cursor! },
      });

      const rows = [...page1.items, ...page2.items];
      expect(rows.map((p) => p.id)).toEqual([idB, idA]); // newest first
      expect(rows.filter((p) => p.primary).map((p) => p.id)).toEqual([idA]);
    });

    it("leaves stored primary flags untouched for a fully-current (1.3.0) page", async () => {
      const passportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      const configA = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      const configB = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      await presentationConfigurationRepository.save(configA);
      await presentationConfigurationRepository.save(configB);

      // The NEWER permalink is the stored primary — the opposite of what the
      // legacy earliest-wins promotion would pick, so a stray normalization shows up.
      const older = Permalink.create({
        presentationConfigurationId: configA.id,
        organizationId,
        createdAt: new Date("2024-05-01T10:00:00.000Z"),
        updatedAt: new Date("2024-05-01T10:00:00.000Z"),
      });
      const newer = Permalink.create({
        presentationConfigurationId: configB.id,
        organizationId,
        primary: true,
        createdAt: new Date("2024-05-02T10:00:00.000Z"),
        updatedAt: new Date("2024-05-02T10:00:00.000Z"),
      });
      await repository.save(older);
      await repository.save(newer);

      const page = await repository.findPageByPassportId(passportId);

      expect(page.items.filter((p) => p.primary).map((p) => p.id)).toEqual([newer.id]);
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
