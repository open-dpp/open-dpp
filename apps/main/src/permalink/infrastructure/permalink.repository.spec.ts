import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { getConnectionToken, getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { DigitalProductDocumentTypes, PermalinkKind } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { gs1DataAttributesPlainFactory } from "@open-dpp/testing";
import type { Connection, Model } from "mongoose";

import { generateMongoConfig } from "../../database/config";
import { PassportDoc, PassportSchema } from "../../passports/infrastructure/passport.schema";
import { PresentationConfiguration } from "../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { Permalink } from "../domain/permalink";
import { PermalinkRepository } from "./permalink.repository";
import { PermalinkDoc, PermalinkSchema } from "./permalink.schema";

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
          { name: PassportDoc.name, schema: PassportSchema },
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
      referenceType: DigitalProductDocumentTypes.Passport,
    });
    const configB = PresentationConfiguration.create({
      organizationId,
      referenceId: passportId,
      referenceType: DigitalProductDocumentTypes.Passport,
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
      referenceType: DigitalProductDocumentTypes.Template,
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
          referenceType: DigitalProductDocumentTypes.Passport,
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

  it("findGs1LinksByUpiIds returns a map keyed by UPI uuid for the requested ids only", async () => {
    const orgId = `org-${randomUUID().slice(0, 8)}`;
    const upiA = randomUUID();
    const upiB = randomUUID();
    const upiUnrequested = randomUUID();

    const linkA = Permalink.create({
      kind: "gs1-link",
      uniqueProductIdentifierId: upiA,
      presentationConfigurationId: null,
      organizationId: orgId,
    });
    const linkB = Permalink.create({
      kind: "gs1-link",
      uniqueProductIdentifierId: upiB,
      presentationConfigurationId: null,
      organizationId: orgId,
    });
    await repository.save(linkA);
    await repository.save(linkB);
    await repository.save(
      Permalink.create({
        kind: "gs1-link",
        uniqueProductIdentifierId: upiUnrequested,
        presentationConfigurationId: null,
        organizationId: orgId,
      }),
    );
    // Presentation permalink (null uniqueProductIdentifierId) must never match
    await repository.save(
      Permalink.create({ presentationConfigurationId: randomUUID(), organizationId: orgId }),
    );

    const found = await repository.findGs1LinksByUpiIds([upiA, upiB, randomUUID()]);

    expect(found.size).toBe(2);
    expect(found.get(upiA)?.id).toBe(linkA.id);
    expect(found.get(upiB)?.id).toBe(linkB.id);
  });

  it("findGs1LinksByUpiIds returns an empty map for empty input", async () => {
    const found = await repository.findGs1LinksByUpiIds([]);
    expect(found.size).toBe(0);
  });

  it("deleteGs1LinksByUpiIds removes only the gs1-links of the given UPIs", async () => {
    const orgId = `org-${randomUUID().slice(0, 8)}`;
    const upiA = randomUUID();
    const upiKeep = randomUUID();
    const linkA = Permalink.create({
      kind: "gs1-link",
      uniqueProductIdentifierId: upiA,
      presentationConfigurationId: null,
      organizationId: orgId,
    });
    const linkKeep = Permalink.create({
      kind: "gs1-link",
      uniqueProductIdentifierId: upiKeep,
      presentationConfigurationId: null,
      organizationId: orgId,
    });
    const presentation = Permalink.create({
      presentationConfigurationId: randomUUID(),
      organizationId: orgId,
    });
    await repository.save(linkA);
    await repository.save(linkKeep);
    await repository.save(presentation);

    await repository.deleteGs1LinksByUpiIds([upiA, randomUUID()]);

    expect(await repository.findOne(linkA.id)).toBeUndefined();
    expect(await repository.findOne(linkKeep.id)).toBeDefined();
    expect(await repository.findOne(presentation.id)).toBeDefined();
  });

  it("onApplicationBootstrap reconciles a stale full-unique index with the schema's partial index", async () => {
    const model = module.get<Model<PermalinkDoc>>(getModelToken(PermalinkDoc.name));

    // Simulate the legacy DB state: the index exists WITHOUT its partial filter.
    // (Clear the collection first — a full unique index cannot build over the
    // multiple presentationConfigurationId:null docs seeded by earlier tests.)
    await model.collection.deleteMany({});
    await model.collection.dropIndex("presentationConfigurationId_1");
    await model.collection.createIndex(
      { presentationConfigurationId: 1 },
      { unique: true, name: "presentationConfigurationId_1" },
    );

    await repository.onApplicationBootstrap();

    const index = (await model.collection.indexes()).find(
      (i) => i.name === "presentationConfigurationId_1",
    );
    expect(index?.partialFilterExpression).toEqual({
      presentationConfigurationId: { $type: "string" },
      kind: PermalinkKind.PRESENTATION,
    });

    // Two gs1-links (both presentationConfigurationId: null) must now coexist.
    const orgId = `org-${randomUUID().slice(0, 8)}`;
    await repository.save(
      Permalink.create({
        kind: "gs1-link",
        uniqueProductIdentifierId: randomUUID(),
        presentationConfigurationId: null,
        organizationId: orgId,
      }),
    );
    await expect(
      repository.save(
        Permalink.create({
          kind: "gs1-link",
          uniqueProductIdentifierId: randomUUID(),
          presentationConfigurationId: null,
          organizationId: orgId,
        }),
      ),
    ).resolves.toBeDefined();
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
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      const configB = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
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
        referenceType: DigitalProductDocumentTypes.Passport,
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
      // Partial last page — no successor, so the cursor is null rather than the
      // last item's, which would make a contract-following consumer page forever.
      expect(page2.pagination.cursor).toBeNull();

      const allIds = [...page1.items.map((p) => p.id), ...page2.items.map((p) => p.id)].sort();
      expect(allIds).toEqual([p1.id, p2.id, p3.id].sort());
    });

    it("returns a null cursor when the last page is exactly full", async () => {
      const orgA = `org-exact-${randomUUID().slice(0, 8)}`;
      const p1 = Permalink.create({
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
      });
      const p2 = Permalink.create({
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
      });

      await repository.save(p1);
      await repository.save(p2);

      const page1 = await repository.findAllByOrganizationId(orgA, { pagination: { limit: 1 } });
      expect(page1.items).toHaveLength(1);
      expect(page1.pagination.cursor).not.toBeNull();

      const page2 = await repository.findAllByOrganizationId(orgA, {
        pagination: { limit: 1, cursor: page1.pagination.cursor! },
      });
      expect(page2.items).toHaveLength(1);
      expect(page2.pagination.cursor).toBeNull();
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

  describe("onApplicationBootstrap organizationId backfill", () => {
    // Rows written before organizationId existed (schema < this branch) carry null.
    // Bootstrap must resolve config → passport → organizationId and stamp them,
    // or the org-scoped list and the /permalinks mutating routes never see them.
    async function seedLegacyRow() {
      const organizationId = randomUUID();
      const passportId = randomUUID();
      const passportModel = module.get<Model<PassportDoc>>(getModelToken(PassportDoc.name));
      // Raw driver insert: the backfill $lookup only needs _id + organizationId.
      await passportModel.collection.insertOne({ _id: passportId as any, organizationId });

      const config = PresentationConfiguration.createForPassport({
        organizationId,
        referenceId: passportId,
      });
      await presentationConfigurationRepository.save(config);

      // Permalink.create without organizationId reproduces the legacy null state.
      const legacy = Permalink.create({ presentationConfigurationId: config.id });
      await repository.save(legacy);
      return { organizationId, legacy };
    }

    it("stamps the passport's organizationId on rows missing it", async () => {
      const { organizationId, legacy } = await seedLegacyRow();
      expect((await repository.findOneOrFail(legacy.id)).organizationId).toBeNull();

      await repository.onApplicationBootstrap();

      expect((await repository.findOneOrFail(legacy.id)).organizationId).toBe(organizationId);
      const listed = await repository.findAllByOrganizationId(organizationId);
      expect(listed.items.map((p) => p.id)).toContain(legacy.id);
    });

    it("leaves rows with a dangling config untouched and does not throw", async () => {
      const orphan = Permalink.create({ presentationConfigurationId: randomUUID() });
      await repository.save(orphan);

      await expect(repository.onApplicationBootstrap()).resolves.not.toThrow();

      expect((await repository.findOneOrFail(orphan.id)).organizationId).toBeNull();
    });

    it("does not overwrite an existing organizationId", async () => {
      const stamped = randomUUID();
      const { organizationId } = await seedLegacyRow();
      const already = Permalink.create({
        presentationConfigurationId: randomUUID(),
        organizationId: stamped,
      });
      await repository.save(already);

      await repository.onApplicationBootstrap();

      expect((await repository.findOneOrFail(already.id)).organizationId).toBe(stamped);
      expect(organizationId).not.toBe(stamped);
    });

    it("is a no-op on an empty collection", async () => {
      await expect(repository.onApplicationBootstrap()).resolves.not.toThrow();
    });
  });

  describe("kind backfill and the presentation-scoped unique index", () => {
    function permalinkCollection() {
      return module.get<Model<PermalinkDoc>>(getModelToken(PermalinkDoc.name)).collection;
    }

    /** A row written before `kind` existed: no field at all, schema 1.2.0. */
    async function seedRowWithoutKind(presentationConfigurationId: string) {
      const id = randomUUID();
      await permalinkCollection().insertOne({
        _id: id as any,
        _schemaVersion: "1.2.0",
        presentationConfigurationId,
        organizationId: randomUUID(),
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      return id;
    }

    it("stamps kind on rows written before the field existed", async () => {
      const id = await seedRowWithoutKind(randomUUID());

      await repository.onApplicationBootstrap();

      const raw = await permalinkCollection().findOne({ _id: id as any });
      expect(raw?.kind).toBe("presentation");
    });

    it("keeps enforcing one presentation permalink per config for backfilled rows", async () => {
      const configId = randomUUID();
      await seedRowWithoutKind(configId);
      await repository.onApplicationBootstrap();

      // Without the backfill this row would sit outside the kind-scoped partial
      // index and the duplicate would be accepted.
      await expect(
        repository.save(Permalink.create({ presentationConfigurationId: configId })),
      ).rejects.toThrow();
    });

    it("accepts a gs1-link on a config that already backs a presentation permalink", async () => {
      const configId = randomUUID();
      await repository.save(Permalink.create({ presentationConfigurationId: configId }));

      const gs1Link = Permalink.create({
        kind: PermalinkKind.GS1_LINK,
        presentationConfigurationId: configId,
        uniqueProductIdentifierId: randomUUID(),
      });

      await expect(repository.save(gs1Link)).resolves.toBeDefined();
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
