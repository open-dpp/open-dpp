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
      connection.collection("unique_product_identifiers").deleteMany({}),
    ]);
  });

  describe("findPageByPassportId (passport-scoped union, paginated)", () => {
    it("returns direct-passportId, legacy-config, and legacy-UPI permalinks, excluding other passports", async () => {
      const passportId = randomUUID();
      const otherPassportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      const direct = Permalink.create({ passportId, organizationId });
      await repository.save(direct);

      const config = PresentationConfiguration.create({
        organizationId,
        referenceId: passportId,
        referenceType: DigitalProductDocumentTypes.Passport,
      });
      await presentationConfigurationRepository.save(config);
      const legacyConfigRowId = randomUUID();
      const now = new Date();
      await connection.collection("permalinks").insertOne({
        _id: legacyConfigRowId as any,
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

      const upiId = randomUUID();
      await connection
        .collection("unique_product_identifiers")
        .insertOne({ _id: upiId as any, referenceId: passportId });
      const legacyGs1RowId = randomUUID();
      await connection.collection("permalinks").insertOne({
        _id: legacyGs1RowId as any,
        _schemaVersion: "1.3.0",
        slug: null,
        baseUrl: null,
        publishedUrl: null,
        presentationConfigurationId: null,
        uniqueProductIdentifierId: upiId,
        organizationId,
        kind: "gs1-link",
        createdAt: now,
        updatedAt: now,
      });

      await repository.save(Permalink.create({ passportId: otherPassportId, organizationId }));

      const result = await repository.findPageByPassportId(passportId);
      const ids = result.items.map((p) => p.id).sort();
      expect(ids).toEqual([direct.id, legacyConfigRowId, legacyGs1RowId].sort());
      for (const item of result.items) {
        expect(item.passportId).toBe(passportId);
      }
    });

    it("returns empty (cursor null) when the passport has no permalinks", async () => {
      const result = await repository.findPageByPassportId(randomUUID());
      expect(result.items).toEqual([]);
      expect(result.pagination.cursor).toBeNull();
    });

    it("paginates the union via cursor (no overlap, no loss)", async () => {
      const passportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      const older = Permalink.create({
        passportId,
        organizationId,
        createdAt: new Date("2024-03-01T10:00:00.000Z"),
        updatedAt: new Date("2024-03-01T10:00:00.000Z"),
      });
      await repository.save(older);

      const newer = Permalink.create({
        kind: "gs1-link",
        passportId,
        uniqueProductIdentifierId: randomUUID(),
        presentationConfigurationId: null,
        organizationId,
        createdAt: new Date("2024-03-02T10:00:00.000Z"),
        updatedAt: new Date("2024-03-02T10:00:00.000Z"),
      });
      await repository.save(newer);

      const page1 = await repository.findPageByPassportId(passportId, {
        pagination: { limit: 1 },
      });
      expect(page1.items).toHaveLength(1);
      expect(page1.pagination.cursor).not.toBeNull();
      expect(page1.items[0].id).toBe(newer.id);

      const page2 = await repository.findPageByPassportId(passportId, {
        pagination: { limit: 1, cursor: page1.pagination.cursor! },
      });
      expect(page2.items).toHaveLength(1);
      expect(page2.items[0].id).toBe(older.id);
      expect(page2.pagination.cursor).toBeNull();
    });

    it("returns a null cursor on a partial last page", async () => {
      const passportId = randomUUID();
      const organizationId = `org-${randomUUID().slice(0, 8)}`;

      for (const createdAt of [
        new Date("2024-04-01T10:00:00.000Z"),
        new Date("2024-04-02T10:00:00.000Z"),
        new Date("2024-04-03T10:00:00.000Z"),
      ]) {
        await repository.save(
          Permalink.create({ passportId, organizationId, createdAt, updatedAt: createdAt }),
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
  });

  afterAll(async () => {
    await module.close();
  });
});
