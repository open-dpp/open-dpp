import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { getConnectionToken, getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { PresentationReferenceType } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { gs1DataAttributesPlainFactory } from "@open-dpp/testing";
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

  it("persists and loads a permalink", async () => {
    const permalink = Permalink.create({ presentationConfigurationId: randomUUID() });

    await repository.save(permalink);
    const found = await repository.findOneOrFail(permalink.id);

    expect(found.id).toBe(permalink.id);
    expect(found.slug).toBeNull();
    expect(found.presentationConfigurationId).toBe(permalink.presentationConfigurationId);
  });

  it("persists and loads a frozen publishedUrl", async () => {
    const permalink = Permalink.create({
      presentationConfigurationId: randomUUID(),
      slug: `slug-${randomUUID().slice(0, 8)}`,
    }).withPublishedUrl("https://passports.example.com/p/acme-widget");

    await repository.save(permalink);
    const found = await repository.findOneOrFail(permalink.id);

    expect(found.publishedUrl).toBe("https://passports.example.com/p/acme-widget");
  });

  it("loads publishedUrl as null when never frozen", async () => {
    const permalink = Permalink.create({ presentationConfigurationId: randomUUID() });
    await repository.save(permalink);

    const found = await repository.findOneOrFail(permalink.id);
    expect(found.publishedUrl).toBeNull();
  });

  it("finds a permalink by slug", async () => {
    const permalink = Permalink.create({
      presentationConfigurationId: randomUUID(),
      slug: `slug-${randomUUID().slice(0, 8)}`,
    });
    await repository.save(permalink);

    const found = await repository.findBySlugOrFail(permalink.slug!);
    expect(found.id).toBe(permalink.id);
  });

  it("allows multiple permalinks with null slugs (partial unique index)", async () => {
    const first = Permalink.create({ presentationConfigurationId: randomUUID() });
    const second = Permalink.create({ presentationConfigurationId: randomUUID() });

    await repository.save(first);
    await repository.save(second);

    expect((await repository.findOneOrFail(first.id)).slug).toBeNull();
    expect((await repository.findOneOrFail(second.id)).slug).toBeNull();
  });

  it("rejects a duplicate slug (unique index)", async () => {
    const slug = `dup-${randomUUID().slice(0, 8)}`;
    await repository.save(Permalink.create({ presentationConfigurationId: randomUUID(), slug }));

    await expect(
      repository.save(Permalink.create({ presentationConfigurationId: randomUUID(), slug })),
    ).rejects.toThrow();
  });

  it("rejects a duplicate presentationConfigurationId (unique index)", async () => {
    const presentationConfigurationId = randomUUID();
    await repository.save(Permalink.create({ presentationConfigurationId }));

    await expect(
      repository.save(Permalink.create({ presentationConfigurationId })),
    ).rejects.toThrow();
  });

  it("finds by presentationConfigurationId", async () => {
    const presentationConfigurationId = randomUUID();
    const permalink = Permalink.create({ presentationConfigurationId });
    await repository.save(permalink);

    const found = await repository.findByPresentationConfigurationId(presentationConfigurationId);
    expect(found?.id).toBe(permalink.id);

    const missing = await repository.findByPresentationConfigurationId(randomUUID());
    expect(missing).toBeUndefined();
  });

  it("findAllByPassportId returns every permalink for the passport via presentation configuration join", async () => {
    const passportId = randomUUID();
    const organizationId = `org-${randomUUID().slice(0, 8)}`;
    const configA = PresentationConfiguration.create({
      organizationId,
      referenceId: passportId,
      referenceType: PresentationReferenceType.Passport,
    });
    const configB = PresentationConfiguration.create({
      organizationId,
      referenceId: passportId,
      referenceType: PresentationReferenceType.Passport,
    });
    await presentationConfigurationRepository.save(configA);
    await presentationConfigurationRepository.save(configB);

    const permalinkA = Permalink.create({ presentationConfigurationId: configA.id });
    const permalinkB = Permalink.create({ presentationConfigurationId: configB.id });
    await repository.save(permalinkA);
    await repository.save(permalinkB);

    const found = await repository.findAllByPassportId(passportId);
    expect(found).toHaveLength(2);
    expect(found.map((p) => p.id).sort()).toEqual([permalinkA.id, permalinkB.id].sort());
  });

  it("findAllByPassportId returns empty array when none exist", async () => {
    const found = await repository.findAllByPassportId(randomUUID());
    expect(found).toEqual([]);
  });

  it("findAllByPassportId ignores template-type configurations", async () => {
    const templateId = randomUUID();
    const config = PresentationConfiguration.create({
      organizationId: "org-template",
      referenceId: templateId,
      referenceType: PresentationReferenceType.Template,
    });
    await presentationConfigurationRepository.save(config);
    await repository.save(Permalink.create({ presentationConfigurationId: config.id }));

    const found = await repository.findAllByPassportId(templateId);
    expect(found).toEqual([]);
  });

  it("deleteAllByPassportId removes every permalink belonging to the passport's configs", async () => {
    const passportId = randomUUID();
    const organizationId = `org-${randomUUID().slice(0, 8)}`;
    const configs = await Promise.all(
      [0, 1].map(async () => {
        const config = PresentationConfiguration.create({
          organizationId,
          referenceId: passportId,
          referenceType: PresentationReferenceType.Passport,
        });
        await presentationConfigurationRepository.save(config);
        await repository.save(Permalink.create({ presentationConfigurationId: config.id }));
        return config;
      }),
    );

    const deleted = await repository.deleteAllByPassportId(passportId);
    expect(deleted).toBe(2);

    for (const config of configs) {
      expect(await repository.findByPresentationConfigurationId(config.id)).toBeUndefined();
    }
  });

  it("deleteAllByPassportId returns 0 when no configs exist for the passport", async () => {
    const deleted = await repository.deleteAllByPassportId(randomUUID());
    expect(deleted).toBe(0);
  });

  it("rolls back session transactions", async () => {
    const presentationConfigurationId = randomUUID();
    const session = await connection.startSession();
    try {
      session.startTransaction();
      await repository.save(Permalink.create({ presentationConfigurationId }), { session });
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }

    const found = await repository.findByPresentationConfigurationId(presentationConfigurationId);
    expect(found).toBeUndefined();
  });

  // Slice 19: organizationId, primary, nullable presentationConfigurationId

  it("persists and loads organizationId, primary, and a null presentationConfigurationId", async () => {
    const organizationId = `org-${randomUUID().slice(0, 8)}`;
    const permalink = Permalink.create({
      kind: "gs1-link",
      uniqueProductIdentifierId: randomUUID(),
      presentationConfigurationId: null,
      primary: true,
      organizationId,
    });

    await repository.save(permalink);
    const found = await repository.findOneOrFail(permalink.id);

    expect(found.organizationId).toBe(organizationId);
    expect(found.primary).toBe(true);
    expect(found.presentationConfigurationId).toBeNull();
  });

  it("allows multiple permalinks with null presentationConfigurationId (partial unique index)", async () => {
    const organizationId = `org-${randomUUID().slice(0, 8)}`;
    const first = Permalink.create({
      kind: "gs1-link",
      uniqueProductIdentifierId: randomUUID(),
      presentationConfigurationId: null,
      organizationId,
    });
    const second = Permalink.create({
      kind: "gs1-link",
      uniqueProductIdentifierId: randomUUID(),
      presentationConfigurationId: null,
      organizationId,
    });

    await repository.save(first);
    await repository.save(second);

    expect((await repository.findOneOrFail(first.id)).presentationConfigurationId).toBeNull();
    expect((await repository.findOneOrFail(second.id)).presentationConfigurationId).toBeNull();
  });

  // Slice 20: GS1-link fields (uniqueProductIdentifierId, gs1DataAttributes)

  it("persists and round-trips a GS1 Digital Link permalink", async () => {
    const upiUuid = randomUUID();
    const gs1DataAttributes = gs1DataAttributesPlainFactory.build(
      {},
      { transient: { entries: { "17": "251231", "3103": "000189" } } },
    );
    const permalink = Permalink.create({
      kind: "gs1-link",
      uniqueProductIdentifierId: upiUuid,
      presentationConfigurationId: null,
      gs1DataAttributes,
      organizationId: `org-${randomUUID().slice(0, 8)}`,
    });

    await repository.save(permalink);
    const found = await repository.findOneOrFail(permalink.id);

    expect(found.uniqueProductIdentifierId).toBe(upiUuid);
    expect(found.gs1DataAttributes).toEqual(gs1DataAttributes);
    expect(found.presentationConfigurationId).toBeNull();
  });

  it("enforces at most one GS1-link permalink per UPI (partial unique uniqueProductIdentifierId)", async () => {
    const upiUuid = randomUUID();
    const orgId = `org-${randomUUID().slice(0, 8)}`;

    await repository.save(
      Permalink.create({
        kind: "gs1-link",
        uniqueProductIdentifierId: upiUuid,
        presentationConfigurationId: null,
        organizationId: orgId,
      }),
    );

    // A second permalink referencing the same UPI should be rejected
    await expect(
      repository.save(
        Permalink.create({
          kind: "gs1-link",
          uniqueProductIdentifierId: upiUuid,
          presentationConfigurationId: null,
          organizationId: orgId,
        }),
      ),
    ).rejects.toThrow();

    // Two permalinks with null uniqueProductIdentifierId should both persist
    const nullFirst = Permalink.create({
      presentationConfigurationId: randomUUID(),
      organizationId: orgId,
    });
    const nullSecond = Permalink.create({
      presentationConfigurationId: randomUUID(),
      organizationId: orgId,
    });
    await repository.save(nullFirst);
    await repository.save(nullSecond);

    expect((await repository.findOneOrFail(nullFirst.id)).uniqueProductIdentifierId).toBeNull();
    expect((await repository.findOneOrFail(nullSecond.id)).uniqueProductIdentifierId).toBeNull();
  });

  // Slice 21: deleteById

  it("deleteById removes a single permalink", async () => {
    const organizationId = `org-${randomUUID().slice(0, 8)}`;
    const target = Permalink.create({
      presentationConfigurationId: randomUUID(),
      organizationId,
    });
    const unrelated = Permalink.create({
      presentationConfigurationId: randomUUID(),
      organizationId,
    });

    await repository.save(target);
    await repository.save(unrelated);

    await repository.deleteById(target.id);

    const found = await repository.findOne(target.id);
    expect(found).toBeUndefined();

    const stillThere = await repository.findOneOrFail(unrelated.id);
    expect(stillThere.id).toBe(unrelated.id);
  });

  it("deleteById is a no-op for an unknown id", async () => {
    await expect(repository.deleteById(randomUUID())).resolves.toBeUndefined();
  });

  // Slice 22: findPrimaryByPassportId, findGs1LinkByUpiId, findAllByOrganizationId

  describe("findPrimaryByPassportId", () => {
    it("returns the primary permalink for a passport", async () => {
      const passportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      const configA = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: PresentationReferenceType.Passport,
      });
      const configB = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: PresentationReferenceType.Passport,
      });
      await presentationConfigurationRepository.save(configA);
      await presentationConfigurationRepository.save(configB);

      const permalinkA = Permalink.create({
        presentationConfigurationId: configA.id,
        organizationId,
        primary: false,
      });
      const permalinkB = Permalink.create({
        presentationConfigurationId: configB.id,
        organizationId,
        primary: true,
      });
      await repository.save(permalinkA);
      await repository.save(permalinkB);

      const primary = await repository.findPrimaryByPassportId(passportId);
      expect(primary?.id).toBe(permalinkB.id);
    });

    it("returns undefined when no primary permalink exists for the passport", async () => {
      const passportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      const config = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: PresentationReferenceType.Passport,
      });
      await presentationConfigurationRepository.save(config);
      await repository.save(
        Permalink.create({
          presentationConfigurationId: config.id,
          organizationId,
          primary: false,
        }),
      );

      const primary = await repository.findPrimaryByPassportId(passportId);
      expect(primary).toBeUndefined();
    });

    it("never returns a gs1-link permalink (null presentationConfigurationId) as primary", async () => {
      const passportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      // gs1-link permalink with no config reference — should never be the primary for a passport
      const gs1Link = Permalink.create({
        kind: "gs1-link",
        uniqueProductIdentifierId: randomUUID(),
        presentationConfigurationId: null,
        organizationId,
        primary: true,
      });
      await repository.save(gs1Link);

      const primary = await repository.findPrimaryByPassportId(passportId);
      expect(primary).toBeUndefined();
    });
  });

  describe("findGs1LinkByUpiId", () => {
    it("returns a gs1-link permalink by its UPI uuid", async () => {
      const upiUuid = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      const gs1Link = Permalink.create({
        kind: "gs1-link",
        uniqueProductIdentifierId: upiUuid,
        presentationConfigurationId: null,
        organizationId,
      });
      await repository.save(gs1Link);

      const found = await repository.findGs1LinkByUpiId(upiUuid);
      expect(found?.id).toBe(gs1Link.id);
    });

    it("returns undefined for an unknown upi uuid", async () => {
      const found = await repository.findGs1LinkByUpiId(randomUUID());
      expect(found).toBeUndefined();
    });

    it("never matches a presentation permalink (null uniqueProductIdentifierId)", async () => {
      const upiUuid = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      // presentation permalink — should not match
      await repository.save(
        Permalink.create({ presentationConfigurationId: randomUUID(), organizationId }),
      );

      const found = await repository.findGs1LinkByUpiId(upiUuid);
      expect(found).toBeUndefined();
    });
  });

  describe("findAllByOrganizationId", () => {
    it("returns all permalinks for the given org, excluding other orgs, sorted createdAt desc", async () => {
      const orgA = `org-a-${randomUUID().slice(0, 8)}`;
      const orgB = `org-b-${randomUUID().slice(0, 8)}`;

      const pA1 = Permalink.create({
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
      });
      const pA2 = Permalink.create({
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
      });
      const pA3 = Permalink.create({
        kind: "gs1-link",
        uniqueProductIdentifierId: randomUUID(),
        presentationConfigurationId: null,
        organizationId: orgA,
      });
      const pB = Permalink.create({
        presentationConfigurationId: randomUUID(),
        organizationId: orgB,
      });

      await repository.save(pA1);
      await repository.save(pA2);
      await repository.save(pA3);
      await repository.save(pB);

      const result = await repository.findAllByOrganizationId(orgA);
      expect(result.items).toHaveLength(3);
      expect(result.items.map((p) => p.id).sort()).toEqual([pA1.id, pA2.id, pA3.id].sort());

      const orgBResult = await repository.findAllByOrganizationId(orgB);
      expect(orgBResult.items).toHaveLength(1);
      expect(orgBResult.items[0].id).toBe(pB.id);
    });

    it("paginates with cursor and returns remainder on second page (no overlap)", async () => {
      const orgA = `org-paginate-${randomUUID().slice(0, 8)}`;

      const p1 = Permalink.create({
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
      });
      const p2 = Permalink.create({
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
      });
      const p3 = Permalink.create({
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
      });

      await repository.save(p1);
      await repository.save(p2);
      await repository.save(p3);

      const page1 = await repository.findAllByOrganizationId(orgA, {
        pagination: { limit: 2 },
      });
      expect(page1.items).toHaveLength(2);
      expect(page1.pagination.cursor).not.toBeNull();

      const page2 = await repository.findAllByOrganizationId(orgA, {
        pagination: { limit: 2, cursor: page1.pagination.cursor! },
      });
      expect(page2.items).toHaveLength(1);

      const allIds = [...page1.items.map((p) => p.id), ...page2.items.map((p) => p.id)].sort();
      expect(allIds).toEqual([p1.id, p2.id, p3.id].sort());
    });

    it("handles identical createdAt timestamps via _id tiebreaker (no overlap, no loss)", async () => {
      const orgA = `org-tiebreak-${randomUUID().slice(0, 8)}`;
      const sharedDate = new Date("2024-01-15T12:00:00.000Z");

      // Create two permalinks with IDENTICAL createdAt
      const pFirst = Permalink.create({
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
        createdAt: sharedDate,
        updatedAt: sharedDate,
      });
      const pSecond = Permalink.create({
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
        createdAt: sharedDate,
        updatedAt: sharedDate,
      });
      const pThird = Permalink.create({
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
        createdAt: new Date("2024-01-14T12:00:00.000Z"),
        updatedAt: sharedDate,
      });

      await repository.save(pFirst);
      await repository.save(pSecond);
      await repository.save(pThird);

      // Page through all with limit:1 — each step must return exactly one new permalink
      const page1 = await repository.findAllByOrganizationId(orgA, { pagination: { limit: 1 } });
      expect(page1.items).toHaveLength(1);
      expect(page1.pagination.cursor).not.toBeNull();

      const page2 = await repository.findAllByOrganizationId(orgA, {
        pagination: { limit: 1, cursor: page1.pagination.cursor! },
      });
      expect(page2.items).toHaveLength(1);
      expect(page2.pagination.cursor).not.toBeNull();

      const page3 = await repository.findAllByOrganizationId(orgA, {
        pagination: { limit: 1, cursor: page2.pagination.cursor! },
      });
      expect(page3.items).toHaveLength(1);

      // Assert all 3 IDs were returned exactly once (no overlap, no loss)
      const allIds = [page1.items[0].id, page2.items[0].id, page3.items[0].id].sort();
      expect(allIds).toEqual([pFirst.id, pSecond.id, pThird.id].sort());
    });
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
        referenceType: PresentationReferenceType.Passport,
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
        referenceType: PresentationReferenceType.Passport,
      });
      const configB = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: PresentationReferenceType.Passport,
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
        referenceType: PresentationReferenceType.Passport,
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
        referenceType: PresentationReferenceType.Passport,
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
        referenceType: PresentationReferenceType.Passport,
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

      const allIds = [page1.items[0].id, page2.items[0].id].sort();
      expect(allIds).toEqual([presentation.id, gs1Link.id].sort());
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
