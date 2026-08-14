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
      connection.collection("permalinks").deleteMany({}),
      connection.collection("presentationconfigurationdocs").deleteMany({}),
    ]);
  });

  it("persists and loads a permalink including its passportId", async () => {
    const passportId = randomUUID();
    const permalink = Permalink.create({
      passportId,
      presentationConfigurationId: randomUUID(),
    });

    await repository.save(permalink);
    const found = await repository.findOneOrFail(permalink.id);

    expect(found.id).toBe(permalink.id);
    expect(found.passportId).toBe(passportId);
    expect(found.slug).toBeNull();
    expect(found.presentationConfigurationId).toBe(permalink.presentationConfigurationId);
  });

  it("persists and loads a bare permalink (no config, no UPI)", async () => {
    const permalink = Permalink.create({ passportId: randomUUID() });

    await repository.save(permalink);
    const found = await repository.findOneOrFail(permalink.id);

    expect(found.presentationConfigurationId).toBeNull();
    expect(found.uniqueProductIdentifierId).toBeNull();
  });

  it("persists and loads a frozen publishedUrl", async () => {
    const permalink = Permalink.create({
      passportId: randomUUID(),
      presentationConfigurationId: randomUUID(),
      slug: `slug-${randomUUID().slice(0, 8)}`,
    }).withPublishedUrl("https://passports.example.com/p/acme-widget");

    await repository.save(permalink);
    const found = await repository.findOneOrFail(permalink.id);

    expect(found.publishedUrl).toBe("https://passports.example.com/p/acme-widget");
  });

  it("finds a permalink by slug", async () => {
    const permalink = Permalink.create({
      passportId: randomUUID(),
      presentationConfigurationId: randomUUID(),
      slug: `slug-${randomUUID().slice(0, 8)}`,
    });
    await repository.save(permalink);

    const found = await repository.findBySlugOrFail(permalink.slug!);
    expect(found.id).toBe(permalink.id);
  });

  it("allows multiple permalinks with null slugs (partial unique index)", async () => {
    const first = Permalink.create({
      passportId: randomUUID(),
      presentationConfigurationId: randomUUID(),
    });
    const second = Permalink.create({
      passportId: randomUUID(),
      presentationConfigurationId: randomUUID(),
    });

    await repository.save(first);
    await repository.save(second);

    expect((await repository.findOneOrFail(first.id)).slug).toBeNull();
    expect((await repository.findOneOrFail(second.id)).slug).toBeNull();
  });

  it("rejects a duplicate slug (unique index)", async () => {
    const slug = `dup-${randomUUID().slice(0, 8)}`;
    await repository.save(
      Permalink.create({
        passportId: randomUUID(),
        presentationConfigurationId: randomUUID(),
        slug,
      }),
    );

    await expect(
      repository.save(
        Permalink.create({
          passportId: randomUUID(),
          presentationConfigurationId: randomUUID(),
          slug,
        }),
      ),
    ).rejects.toThrow();
  });

  it("allows multiple permalinks sharing one presentationConfigurationId (config-unique index dropped)", async () => {
    const passportId = randomUUID();
    const presentationConfigurationId = randomUUID();
    const first = Permalink.create({ passportId, presentationConfigurationId });
    const second = Permalink.create({ passportId, presentationConfigurationId });

    await repository.save(first);
    await expect(repository.save(second)).resolves.toBeDefined();
  });

  it("finds by presentationConfigurationId", async () => {
    const presentationConfigurationId = randomUUID();
    const permalink = Permalink.create({
      passportId: randomUUID(),
      presentationConfigurationId,
    });
    await repository.save(permalink);

    const found = await repository.findByPresentationConfigurationId(presentationConfigurationId);
    expect(found?.id).toBe(permalink.id);

    const missing = await repository.findByPresentationConfigurationId(randomUUID());
    expect(missing).toBeUndefined();
  });

  describe("findAllByPassportId (union across ref paths)", () => {
    it("returns permalinks matched directly by passportId — no config join needed", async () => {
      const passportId = randomUUID();
      const bare = Permalink.create({ passportId });
      const withUpi = Permalink.create({
        passportId,
        uniqueProductIdentifierId: randomUUID(),
      });
      await repository.save(bare);
      await repository.save(withUpi);

      const found = await repository.findAllByPassportId(passportId);
      expect(found.map((p) => p.id).sort()).toEqual([bare.id, withUpi.id].sort());
    });

    it("returns legacy permalinks lacking passportId via the presentation configuration join", async () => {
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
        _schemaVersion: "1.3.0",
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        presentationConfigurationId: config.id,
        organizationId,
        kind: "presentation",
        createdAt: now,
        updatedAt: now,
      });

      const found = await repository.findAllByPassportId(passportId);
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(legacyId);
      expect(found[0].passportId).toBe(passportId);
      expect(found[0].kind).toBe(PermalinkKind.OPEN_DPP);
    });

    it("returns empty array when none exist", async () => {
      const found = await repository.findAllByPassportId(randomUUID());
      expect(found).toEqual([]);
    });

    it("ignores template-type configurations", async () => {
      const templateId = randomUUID();
      const config = PresentationConfiguration.create({
        organizationId: "org-template",
        referenceId: templateId,
        referenceType: DigitalProductDocumentTypes.Template,
      });
      await presentationConfigurationRepository.save(config);
      await repository.save(
        Permalink.create({
          passportId: randomUUID(),
          presentationConfigurationId: config.id,
        }),
      );

      const found = await repository.findAllByPassportId(templateId);
      expect(found).toEqual([]);
    });
  });

  describe("deleteAllByPassportId", () => {
    it("removes permalinks matched by passportId and by legacy config join", async () => {
      const passportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;
      const config = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      await presentationConfigurationRepository.save(config);

      const direct = Permalink.create({ passportId });
      await repository.save(direct);
      const legacyId = randomUUID();
      const now = new Date();
      await connection.collection("permalinks").insertOne({
        _id: legacyId as any,
        _schemaVersion: "1.3.0",
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        presentationConfigurationId: config.id,
        organizationId,
        kind: "presentation",
        createdAt: now,
        updatedAt: now,
      });

      const deleted = await repository.deleteAllByPassportId(passportId);
      expect(deleted).toBe(2);

      expect(await repository.findOne(direct.id)).toBeUndefined();
      expect(
        await connection.collection("permalinks").findOne({ _id: legacyId as any }),
      ).toBeNull();
    });

    it("returns 0 when nothing belongs to the passport", async () => {
      const deleted = await repository.deleteAllByPassportId(randomUUID());
      expect(deleted).toBe(0);
    });
  });

  it("rolls back session transactions", async () => {
    const presentationConfigurationId = randomUUID();
    const session = await connection.startSession();
    try {
      session.startTransaction();
      await repository.save(
        Permalink.create({ passportId: randomUUID(), presentationConfigurationId }),
        { session },
      );
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }

    const found = await repository.findByPresentationConfigurationId(presentationConfigurationId);
    expect(found).toBeUndefined();
  });

  it("persists and loads organizationId and a null presentationConfigurationId", async () => {
    const organizationId = `org-${randomUUID().slice(0, 8)}`;
    const permalink = Permalink.create({
      kind: "gs1-link",
      passportId: randomUUID(),
      uniqueProductIdentifierId: randomUUID(),
      presentationConfigurationId: null,
      organizationId,
    });

    await repository.save(permalink);
    const found = await repository.findOneOrFail(permalink.id);

    expect(found.organizationId).toBe(organizationId);
    expect(found.presentationConfigurationId).toBeNull();
  });

  it("persists and round-trips a GS1 Digital Link permalink", async () => {
    const upiUuid = randomUUID();
    const gs1DataAttributes = gs1DataAttributesPlainFactory.build(
      {},
      { transient: { entries: { "17": "251231", "3103": "000189" } } },
    );
    const permalink = Permalink.create({
      kind: "gs1-link",
      passportId: randomUUID(),
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

  describe("kind-scoped UPI uniqueness", () => {
    it("enforces at most one gs1-link permalink per UPI", async () => {
      const upiUuid = randomUUID();
      const orgId = `org-${randomUUID().slice(0, 8)}`;

      await repository.save(
        Permalink.create({
          kind: "gs1-link",
          passportId: randomUUID(),
          uniqueProductIdentifierId: upiUuid,
          presentationConfigurationId: null,
          organizationId: orgId,
        }),
      );

      await expect(
        repository.save(
          Permalink.create({
            kind: "gs1-link",
            passportId: randomUUID(),
            uniqueProductIdentifierId: upiUuid,
            presentationConfigurationId: null,
            organizationId: orgId,
          }),
        ),
      ).rejects.toThrow();
    });

    it("allows multiple open-dpp permalinks bound to the same UPI", async () => {
      const passportId = randomUUID();
      const upiUuid = randomUUID();

      await repository.save(Permalink.create({ passportId, uniqueProductIdentifierId: upiUuid }));
      await expect(
        repository.save(Permalink.create({ passportId, uniqueProductIdentifierId: upiUuid })),
      ).resolves.toBeDefined();
    });

    it("allows an open-dpp permalink on a UPI that already carries a gs1-link", async () => {
      const passportId = randomUUID();
      const upiUuid = randomUUID();

      await repository.save(
        Permalink.create({
          kind: "gs1-link",
          passportId,
          uniqueProductIdentifierId: upiUuid,
          presentationConfigurationId: null,
        }),
      );
      await expect(
        repository.save(Permalink.create({ passportId, uniqueProductIdentifierId: upiUuid })),
      ).resolves.toBeDefined();
    });
  });

  describe("findGs1LinkByUpiId", () => {
    it("returns a gs1-link permalink by its UPI uuid", async () => {
      const upiUuid = randomUUID();
      const gs1Link = Permalink.create({
        kind: "gs1-link",
        passportId: randomUUID(),
        uniqueProductIdentifierId: upiUuid,
        presentationConfigurationId: null,
      });
      await repository.save(gs1Link);

      const found = await repository.findGs1LinkByUpiId(upiUuid);
      expect(found?.id).toBe(gs1Link.id);
    });

    it("returns undefined for an unknown upi uuid", async () => {
      const found = await repository.findGs1LinkByUpiId(randomUUID());
      expect(found).toBeUndefined();
    });

    it("never matches an open-dpp permalink bound to the same UPI", async () => {
      const upiUuid = randomUUID();
      await repository.save(
        Permalink.create({ passportId: randomUUID(), uniqueProductIdentifierId: upiUuid }),
      );

      const found = await repository.findGs1LinkByUpiId(upiUuid);
      expect(found).toBeUndefined();
    });
  });

  describe("findGs1LinksByUpiIds", () => {
    it("returns a map keyed by UPI uuid for the requested ids only, gs1-links only", async () => {
      const orgId = `org-${randomUUID().slice(0, 8)}`;
      const upiA = randomUUID();
      const upiB = randomUUID();
      const upiOpenDpp = randomUUID();

      const linkA = Permalink.create({
        kind: "gs1-link",
        passportId: randomUUID(),
        uniqueProductIdentifierId: upiA,
        presentationConfigurationId: null,
        organizationId: orgId,
      });
      const linkB = Permalink.create({
        kind: "gs1-link",
        passportId: randomUUID(),
        uniqueProductIdentifierId: upiB,
        presentationConfigurationId: null,
        organizationId: orgId,
      });
      await repository.save(linkA);
      await repository.save(linkB);
      await repository.save(
        Permalink.create({
          passportId: randomUUID(),
          uniqueProductIdentifierId: upiOpenDpp,
          organizationId: orgId,
        }),
      );

      const found = await repository.findGs1LinksByUpiIds([upiA, upiB, upiOpenDpp]);

      expect(found.size).toBe(2);
      expect(found.get(upiA)?.id).toBe(linkA.id);
      expect(found.get(upiB)?.id).toBe(linkB.id);
    });

    it("returns an empty map for empty input", async () => {
      const found = await repository.findGs1LinksByUpiIds([]);
      expect(found.size).toBe(0);
    });
  });

  it("deleteGs1LinksByUpiIds removes the permalinks of the given UPIs", async () => {
    const orgId = `org-${randomUUID().slice(0, 8)}`;
    const upiA = randomUUID();
    const upiKeep = randomUUID();
    const linkA = Permalink.create({
      kind: "gs1-link",
      passportId: randomUUID(),
      uniqueProductIdentifierId: upiA,
      presentationConfigurationId: null,
      organizationId: orgId,
    });
    const linkKeep = Permalink.create({
      kind: "gs1-link",
      passportId: randomUUID(),
      uniqueProductIdentifierId: upiKeep,
      presentationConfigurationId: null,
      organizationId: orgId,
    });
    const unrelated = Permalink.create({
      passportId: randomUUID(),
      presentationConfigurationId: randomUUID(),
      organizationId: orgId,
    });
    await repository.save(linkA);
    await repository.save(linkKeep);
    await repository.save(unrelated);

    await repository.deleteGs1LinksByUpiIds([upiA, randomUUID()]);

    expect(await repository.findOne(linkA.id)).toBeUndefined();
    expect(await repository.findOne(linkKeep.id)).toBeDefined();
    expect(await repository.findOne(unrelated.id)).toBeDefined();
  });

  it("onApplicationBootstrap drops the retired config-unique index", async () => {
    const model = module.get<Model<PermalinkDoc>>(getModelToken(PermalinkDoc.name));

    await model.collection.deleteMany({});
    const existing = (await model.collection.indexes()).map((i) => i.name);
    if (!existing.includes("presentationConfigurationId_1")) {
      await model.collection.createIndex(
        { presentationConfigurationId: 1 },
        {
          unique: true,
          name: "presentationConfigurationId_1",
          partialFilterExpression: { presentationConfigurationId: { $type: "string" } },
        },
      );
    }

    await repository.onApplicationBootstrap();

    const names = (await model.collection.indexes()).map((i) => i.name);
    expect(names).not.toContain("presentationConfigurationId_1");

    const passportId = randomUUID();
    const configId = randomUUID();
    await repository.save(Permalink.create({ passportId, presentationConfigurationId: configId }));
    await expect(
      repository.save(Permalink.create({ passportId, presentationConfigurationId: configId })),
    ).resolves.toBeDefined();
  });

  it("deleteById removes a single permalink", async () => {
    const organizationId = `org-${randomUUID().slice(0, 8)}`;
    const target = Permalink.create({
      passportId: randomUUID(),
      presentationConfigurationId: randomUUID(),
      organizationId,
    });
    const unrelated = Permalink.create({
      passportId: randomUUID(),
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

  describe("findAllByOrganizationId", () => {
    it("returns all permalinks for the given org, excluding other orgs", async () => {
      const orgA = `org-a-${randomUUID().slice(0, 8)}`;
      const orgB = `org-b-${randomUUID().slice(0, 8)}`;

      const pA1 = Permalink.create({
        passportId: randomUUID(),
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
      });
      const pA2 = Permalink.create({
        passportId: randomUUID(),
        organizationId: orgA,
      });
      const pA3 = Permalink.create({
        kind: "gs1-link",
        passportId: randomUUID(),
        uniqueProductIdentifierId: randomUUID(),
        presentationConfigurationId: null,
        organizationId: orgA,
      });
      const pB = Permalink.create({
        passportId: randomUUID(),
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

      const permalinks = [0, 1, 2].map(() =>
        Permalink.create({
          passportId: randomUUID(),
          presentationConfigurationId: randomUUID(),
          organizationId: orgA,
        }),
      );
      for (const p of permalinks) {
        await repository.save(p);
      }

      const page1 = await repository.findAllByOrganizationId(orgA, {
        pagination: { limit: 2 },
      });
      expect(page1.items).toHaveLength(2);
      expect(page1.pagination.cursor).not.toBeNull();

      const page2 = await repository.findAllByOrganizationId(orgA, {
        pagination: { limit: 2, cursor: page1.pagination.cursor! },
      });
      expect(page2.items).toHaveLength(1);
      expect(page2.pagination.cursor).toBeNull();

      const allIds = [...page1.items.map((p) => p.id), ...page2.items.map((p) => p.id)].sort();
      expect(allIds).toEqual(permalinks.map((p) => p.id).sort());
    });

    it("handles identical createdAt timestamps via _id tiebreaker (no overlap, no loss)", async () => {
      const orgA = `org-tiebreak-${randomUUID().slice(0, 8)}`;
      const sharedDate = new Date("2024-01-15T12:00:00.000Z");

      const pFirst = Permalink.create({
        passportId: randomUUID(),
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
        createdAt: sharedDate,
        updatedAt: sharedDate,
      });
      const pSecond = Permalink.create({
        passportId: randomUUID(),
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
        createdAt: sharedDate,
        updatedAt: sharedDate,
      });
      const pThird = Permalink.create({
        passportId: randomUUID(),
        presentationConfigurationId: randomUUID(),
        organizationId: orgA,
        createdAt: new Date("2024-01-14T12:00:00.000Z"),
        updatedAt: sharedDate,
      });

      await repository.save(pFirst);
      await repository.save(pSecond);
      await repository.save(pThird);

      const page1 = await repository.findAllByOrganizationId(orgA, { pagination: { limit: 1 } });
      const page2 = await repository.findAllByOrganizationId(orgA, {
        pagination: { limit: 1, cursor: page1.pagination.cursor! },
      });
      const page3 = await repository.findAllByOrganizationId(orgA, {
        pagination: { limit: 1, cursor: page2.pagination.cursor! },
      });

      const allIds = [page1.items[0].id, page2.items[0].id, page3.items[0].id].sort();
      expect(allIds).toEqual([pFirst.id, pSecond.id, pThird.id].sort());
    });
  });

  describe("onApplicationBootstrap organizationId backfill", () => {
    async function seedLegacyRow() {
      const organizationId = randomUUID();
      const passportId = randomUUID();
      const passportModel = module.get<Model<PassportDoc>>(getModelToken(PassportDoc.name));
      await passportModel.collection.insertOne({ _id: passportId as any, organizationId });

      const config = PresentationConfiguration.createForPassport({
        organizationId,
        referenceId: passportId,
      });
      await presentationConfigurationRepository.save(config);

      const legacy = Permalink.create({ passportId, presentationConfigurationId: config.id });
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
      const orphan = Permalink.create({
        passportId: randomUUID(),
        presentationConfigurationId: randomUUID(),
      });
      await repository.save(orphan);

      await expect(repository.onApplicationBootstrap()).resolves.not.toThrow();

      expect((await repository.findOneOrFail(orphan.id)).organizationId).toBeNull();
    });

    it("does not overwrite an existing organizationId", async () => {
      const stamped = randomUUID();
      const { organizationId } = await seedLegacyRow();
      const already = Permalink.create({
        passportId: randomUUID(),
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

  describe("kind backfill", () => {
    function permalinkCollection() {
      return module.get<Model<PermalinkDoc>>(getModelToken(PermalinkDoc.name)).collection;
    }

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

    it("stamps kind='open-dpp' on rows written before the field existed", async () => {
      const id = await seedRowWithoutKind(randomUUID());

      await repository.onApplicationBootstrap();

      const raw = await permalinkCollection().findOne({ _id: id as any });
      expect(raw?.kind).toBe(PermalinkKind.OPEN_DPP);
    });

    it("leaves already-stamped legacy 'presentation' rows untouched in storage", async () => {
      const id = randomUUID();
      await permalinkCollection().insertOne({
        _id: id as any,
        _schemaVersion: "1.3.0",
        presentationConfigurationId: randomUUID(),
        organizationId: randomUUID(),
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        kind: "presentation",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await repository.onApplicationBootstrap();

      const raw = await permalinkCollection().findOne({ _id: id as any });
      expect(raw?.kind).toBe("presentation");
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
