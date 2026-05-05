import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { getConnectionToken, getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { PresentationReferenceType } from "@open-dpp/dto";
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
    // Mongoose builds indexes lazily by default; wait so the unique-index
    // tests observe enforcement on the very first duplicate insert.
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
      expect(
        await repository.findByPresentationConfigurationId(config.id),
      ).toBeUndefined();
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

  afterAll(async () => {
    await module.close();
  });
});
