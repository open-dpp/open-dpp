import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { getModelToken } from "@nestjs/mongoose";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { DigitalProductDocumentTypes, PermalinkKind } from "@open-dpp/dto";
import type { Model } from "mongoose";
import { Environment } from "../../../aas/domain/environment";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import {
  ConceptDescriptionDoc,
  ConceptDescriptionSchema,
} from "../../../aas/infrastructure/schemas/concept-description.schema";
import { createAasTestContext } from "../../../aas/presentation/aas.test.context";
import { BrandingRepository } from "../../../branding/infrastructure/branding.repository";
import { BrandingDoc, BrandingSchema } from "../../../branding/infrastructure/branding.schema";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { Passport } from "../../../passports/domain/passport";
import { PassportRepository } from "../../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../../passports/infrastructure/passport.schema";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../../presentation-configurations/infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { PresentationConfigurationsModule } from "../../../presentation-configurations/presentation-configurations.module";
import { Permalink } from "../../domain/permalink";
import { PermalinkRepository } from "../../infrastructure/permalink.repository";
import { PermalinkDoc, PermalinkSchema } from "../../infrastructure/permalink.schema";
import { UniqueProductIdentifier } from "../../../unique-product-identifier/domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import { InstanceSettingsModule } from "../../../instance-settings/instance-settings.module";
import { PermalinkModule } from "../../permalink.module";
import { PermalinkApplicationService } from "./permalink.application.service";

describe("PermalinkApplicationService.ensureDefaultForPassport", () => {
  const basePathV1 = "/v1/p";
  const basePathV2 = "/v2/p";
  const ctx = createAasTestContext(
    basePathV1,
    basePathV2,
    {
      imports: [PermalinkModule, PresentationConfigurationsModule, InstanceSettingsModule],
      providers: [
        PermalinkRepository,
        PermalinkApplicationService,
        PassportRepository,
        BrandingRepository,
        PresentationConfigurationRepository,
      ],
    },
    [
      { name: PassportDoc.name, schema: PassportSchema },
      { name: BrandingDoc.name, schema: BrandingSchema },
      { name: PermalinkDoc.name, schema: PermalinkSchema },
      { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
    ],
    PermalinkRepository,
    SubjectAttributes.create({ userRole: UserRole.USER }),
  );

  beforeAll(async () => {
    await ctx
      .getModuleRef()
      .get<Model<PermalinkDoc>>(getModelToken(PermalinkDoc.name))
      .syncIndexes();
  });

  async function seedPassport() {
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: randomUUID(),
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      }),
    });
    await ctx.getModuleRef().get(PassportRepository).save(passport);
    return passport;
  }

  it("creates both config and permalink when neither exists", async () => {
    const passport = await seedPassport();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const permalink = await service.ensureDefaultForPassport(passport);

    expect(permalink).toBeDefined();
    expect(permalink.id).toBeDefined();

    const config = await ctx
      .getModuleRef()
      .get(PresentationConfigurationRepository)
      .findByReference({
        referenceType: DigitalProductDocumentTypes.Passport,
        referenceId: passport.id,
      });
    expect(config).toBeDefined();
    expect(config!.id).toEqual(permalink.presentationConfigurationId);

    const persistedPermalink = await ctx
      .getModuleRef()
      .get(PermalinkRepository)
      .findByPresentationConfigurationId(config!.id);
    expect(persistedPermalink).toBeDefined();
    expect(persistedPermalink!.id).toEqual(permalink.id);
  });

  it("creates only the permalink when the config already exists", async () => {
    const passport = await seedPassport();
    const existingConfig = PresentationConfiguration.createForPassport({
      organizationId: passport.organizationId,
      referenceId: passport.id,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(existingConfig);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const permalink = await service.ensureDefaultForPassport(passport);

    expect(permalink.presentationConfigurationId).toEqual(existingConfig.id);

    const configs = await ctx
      .getModuleRef()
      .get(PresentationConfigurationRepository)
      .findManyByReference({
        referenceType: DigitalProductDocumentTypes.Passport,
        referenceId: passport.id,
      });
    expect(configs).toHaveLength(1);
    expect(configs[0].id).toEqual(existingConfig.id);
  });

  it("returns the existing permalink when both rows already exist (idempotent)", async () => {
    const passport = await seedPassport();
    const existingConfig = PresentationConfiguration.createForPassport({
      organizationId: passport.organizationId,
      referenceId: passport.id,
    });
    const existingPermalink = Permalink.create({
      presentationConfigurationId: existingConfig.id,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(existingConfig);
    await ctx.getModuleRef().get(PermalinkRepository).save(existingPermalink);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.ensureDefaultForPassport(passport);

    expect(result.id).toEqual(existingPermalink.id);

    const allPermalinks = await ctx
      .getModuleRef()
      .get(PermalinkRepository)
      .findAllByPassportId(passport.id);
    expect(allPermalinks).toHaveLength(1);
    expect(allPermalinks[0].id).toEqual(existingPermalink.id);
  });

  async function seedBranding(organizationId: string) {
    const model = ctx.getModuleRef().get<Model<BrandingDoc>>(getModelToken(BrandingDoc.name));
    await model.create({ organizationId });
  }

  async function seedPublishedPassport() {
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: randomUUID(),
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      }),
    });
    passport.publish();
    await ctx.getModuleRef().get(PassportRepository).save(passport);
    return passport;
  }

  async function seedConfigWithPermalink(passport: Passport, slug?: string) {
    const config = PresentationConfiguration.createForPassport({
      organizationId: passport.organizationId,
      referenceId: passport.id,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
    const permalink = Permalink.create({ presentationConfigurationId: config.id, slug });
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
    return { config, permalink };
  }

  it("freezeAllForPassport freezes every permalink with the resolved public URL", async () => {
    const passport = await seedPublishedPassport();
    await seedBranding(passport.organizationId);
    const { permalink: withSlug } = await seedConfigWithPermalink(passport, "acme-widget");
    const { permalink: noSlug } = await seedConfigWithPermalink(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await service.freezeAllForPassport(passport);

    const repo = ctx.getModuleRef().get(PermalinkRepository);
    expect((await repo.findOneOrFail(withSlug.id)).publishedUrl).toBe(
      "http://localhost:3000/p/acme-widget",
    );
    expect((await repo.findOneOrFail(noSlug.id)).publishedUrl).toBe(
      `http://localhost:3000/p/${noSlug.id}`,
    );
  });

  it("freezeAllForPassport leaves an already-frozen permalink untouched (idempotent)", async () => {
    const passport = await seedPublishedPassport();
    await seedBranding(passport.organizationId);
    const config = PresentationConfiguration.createForPassport({
      organizationId: passport.organizationId,
      referenceId: passport.id,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
    const frozen = Permalink.create({
      presentationConfigurationId: config.id,
      slug: "already-frozen",
    }).withPublishedUrl("https://locked.example.com/p/already-frozen");
    await ctx.getModuleRef().get(PermalinkRepository).save(frozen);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await service.freezeAllForPassport(passport);

    expect(
      (await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(frozen.id)).publishedUrl,
    ).toBe("https://locked.example.com/p/already-frozen");
  });

  it("createPermalinksForConfigs freezes a new permalink when the passport is already published", async () => {
    const passport = await seedPublishedPassport();
    await seedBranding(passport.organizationId);
    const config = PresentationConfiguration.createForPassport({
      organizationId: passport.organizationId,
      referenceId: passport.id,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const [created] = await service.createPermalinksForConfigs([config], passport.organizationId);

    expect(created.publishedUrl).toBe(`http://localhost:3000/p/${created.id}`);
  });

  it("freezeAllForPassport fails loudly when branding cannot be loaded instead of pinning a default URL", async () => {
    const passport = await seedPublishedPassport();
    const { permalink } = await seedConfigWithPermalink(passport, "branding-down");
    const brandingRepo = ctx.getModuleRef().get(BrandingRepository);
    const spy = jest
      .spyOn(brandingRepo, "findOneByOrganizationId")
      .mockRejectedValue(new Error("branding db unavailable"));
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await expect(service.freezeAllForPassport(passport)).rejects.toThrow("branding db unavailable");

    const persisted = await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(permalink.id);
    expect(persisted.publishedUrl).toBeNull();
    spy.mockRestore();
  });

  it("resolvePublicUrlWithFreeze does NOT pin a published permalink when branding could not be loaded", async () => {
    const passport = await seedPublishedPassport();
    const { permalink } = await seedConfigWithPermalink(passport, "needs-branding");
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const { publicUrl } = await service.resolvePublicUrlWithFreeze(
      permalink,
      passport,
      null,
      "http://localhost:3000/p",
    );

    expect(publicUrl).toBe("http://localhost:3000/p/needs-branding");
    const persisted = await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(permalink.id);
    expect(persisted.publishedUrl).toBeNull();
  });

  it("resolvePublicUrlWithFreeze computes the live GS1 Digital Link URL for an unfrozen gs1-link (unpublished passport)", async () => {
    const organizationId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: randomUUID(),
      gtin: "00012345678905",
      organizationId,
    });
    await ctx.getModuleRef().get(UniqueProductIdentifierRepository).save(upi);
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      uniqueProductIdentifierId: upi.uuid,
      baseUrl: "https://id.example.com",
      organizationId,
    });
    const passport = await seedPassport();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const { permalink: unchanged, publicUrl } = await service.resolvePublicUrlWithFreeze(
      permalink,
      passport,
      null,
      "http://localhost:3000/p",
    );

    expect(publicUrl).toBe("https://id.example.com/01/00012345678905");
    // pre-freeze: the permalink stays unfrozen (live-computed, not pinned)
    expect(unchanged.publishedUrl).toBeNull();
  });

  it("resolvePublicUrlWithFreeze falls back to the presentation form when the gs1-link's UPI is missing (deleted)", async () => {
    const organizationId = randomUUID();
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      uniqueProductIdentifierId: randomUUID(),
      baseUrl: "https://id.example.com",
      organizationId,
    });
    const passport = await seedPassport();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const { publicUrl } = await service.resolvePublicUrlWithFreeze(
      permalink,
      passport,
      null,
      "http://localhost:3000/p",
    );

    expect(publicUrl).toBe(`https://id.example.com/${permalink.id}`);
  });

  it("createPermalinksForConfigs recovers idempotently when a concurrent create wins the unique-index race", async () => {
    // This test provokes the unique-index duplicate-key path, so the index on
    // presentationConfigurationId must exist. Mongoose autoIndex is async and lags under the
    // full parallel suite; build it deterministically first (mirrors permalink.repository.spec).
    await ctx
      .getModuleRef()
      .get<Model<PermalinkDoc>>(getModelToken(PermalinkDoc.name))
      .syncIndexes();
    const passport = await seedPassport();
    const config = PresentationConfiguration.createForPassport({
      organizationId: passport.organizationId,
      referenceId: passport.id,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
    const winner = Permalink.create({ presentationConfigurationId: config.id });
    await ctx.getModuleRef().get(PermalinkRepository).save(winner);

    const permalinkRepo = ctx.getModuleRef().get(PermalinkRepository);
    const lookupSpy = jest
      .spyOn(permalinkRepo, "findByPresentationConfigurationId")
      .mockResolvedValueOnce(undefined);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const [result] = await service.createPermalinksForConfigs([config], passport.organizationId);

    expect(result.id).toEqual(winner.id);
    const all = await ctx.getModuleRef().get(PermalinkRepository).findAllByPassportId(passport.id);
    expect(all).toHaveLength(1);
    lookupSpy.mockRestore();
  });

  it("createPermalinksForConfigs does NOT freeze when the passport is still a draft", async () => {
    const passport = await seedPassport();
    const config = PresentationConfiguration.createForPassport({
      organizationId: passport.organizationId,
      referenceId: passport.id,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const [created] = await service.createPermalinksForConfigs([config], passport.organizationId);

    expect(created.publishedUrl).toBeNull();
  });

  it("freezePermalink freezes a gs1-link permalink as its GS1 Digital Link URL, not the presentation form", async () => {
    const organizationId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: randomUUID(),
      gtin: "04006381333931",
      organizationId,
    });
    await ctx.getModuleRef().get(UniqueProductIdentifierRepository).save(upi);
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      uniqueProductIdentifierId: upi.uuid,
      baseUrl: "https://id.example.com",
      organizationId,
    });
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const frozen = await service.freezePermalink(permalink, null, "http://localhost:3000/p");

    expect(frozen.publishedUrl).toBe("https://id.example.com/01/04006381333931");
    const persisted = await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(permalink.id);
    expect(persisted.publishedUrl).toBe("https://id.example.com/01/04006381333931");
  });

  it("freezePermalink threads batch, serial and gs1DataAttributes into the frozen GS1 URL", async () => {
    const organizationId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: randomUUID(),
      gtin: "04006381333931",
      batch: "LOT-42",
      serial: "SN-001",
      organizationId,
    });
    await ctx.getModuleRef().get(UniqueProductIdentifierRepository).save(upi);
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      uniqueProductIdentifierId: upi.uuid,
      baseUrl: "https://id.example.com",
      gs1DataAttributes: { "3103": "000750" },
      organizationId,
    });
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const frozen = await service.freezePermalink(permalink, null, "http://localhost:3000/p");

    expect(frozen.publishedUrl).toBe(
      "https://id.example.com/01/04006381333931/10/LOT-42/21/SN-001?3103=000750",
    );
  });
});

describe("PermalinkApplicationService.resolveToPassport (polymorphic)", () => {
  const ctx = createAasTestContext(
    "/p",
    "/p",
    {
      imports: [PermalinkModule, PresentationConfigurationsModule, InstanceSettingsModule],
      providers: [
        PermalinkRepository,
        PermalinkApplicationService,
        PassportRepository,
        BrandingRepository,
        PresentationConfigurationRepository,
      ],
    },
    [
      { name: PassportDoc.name, schema: PassportSchema },
      { name: BrandingDoc.name, schema: BrandingSchema },
      { name: PermalinkDoc.name, schema: PermalinkSchema },
      { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
    ],
    PermalinkRepository,
    SubjectAttributes.create({ userRole: UserRole.USER }),
  );

  async function seedPassport(options?: { published?: boolean }) {
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: randomUUID(),
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      }),
    });
    if (options?.published) {
      passport.publish();
    }
    await ctx.getModuleRef().get(PassportRepository).save(passport);
    return passport;
  }

  async function seedConfigAndPermalink(
    passport: Passport,
    permalinkOptions?: {
      uniqueProductIdentifierId?: string;
    },
  ) {
    const config = PresentationConfiguration.createForPassport({
      organizationId: passport.organizationId,
      referenceId: passport.id,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
    const permalink = Permalink.create({
      presentationConfigurationId: config.id,
      ...(permalinkOptions?.uniqueProductIdentifierId !== undefined && {
        kind: "gs1-link" as const,
        uniqueProductIdentifierId: permalinkOptions.uniqueProductIdentifierId,
      }),
    });
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
    return { config, permalink };
  }

  // (a) presentation permalink resolves to its config's passport as today
  it("(a) resolves a presentation permalink to its config's passport", async () => {
    const passport = await seedPassport({ published: true });
    const { permalink } = await seedConfigAndPermalink(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.resolveToPassport(permalink.id);

    expect(result.permalink.id).toBe(permalink.id);
    expect(result.passport.id).toBe(passport.id);
    expect(result.presentationConfiguration).toBeDefined();
  });

  // (b) a permalink with both presentationConfigurationId and uniqueProductIdentifierId set
  //     still resolves via the config
  it("(b) resolves a gs1-link permalink with both configId and upiId via the config", async () => {
    const passport = await seedPassport({ published: true });
    const upiId = randomUUID();
    const { config, permalink } = await seedConfigAndPermalink(passport, {
      uniqueProductIdentifierId: upiId,
    });
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.resolveToPassport(permalink.id);

    expect(result.permalink.id).toBe(permalink.id);
    expect(result.presentationConfiguration.id).toBe(config.id);
    expect(result.passport.id).toBe(passport.id);
  });

  // (c) unchanged: throws NotFoundException when the resolved passport is unpublished
  //     and access is anonymous
  it("(c) throws NotFoundException when passport is unpublished and access is anonymous", async () => {
    const passport = await seedPassport({ published: false });
    const { permalink } = await seedConfigAndPermalink(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await expect(service.resolveToPassport(permalink.id, undefined)).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe("PermalinkApplicationService primary management", () => {
  const ctx = createAasTestContext(
    "/p",
    "/p",
    {
      imports: [PermalinkModule, PresentationConfigurationsModule, InstanceSettingsModule],
      providers: [
        PermalinkRepository,
        PermalinkApplicationService,
        PassportRepository,
        BrandingRepository,
        PresentationConfigurationRepository,
      ],
    },
    [
      { name: PassportDoc.name, schema: PassportSchema },
      { name: BrandingDoc.name, schema: BrandingSchema },
      { name: PermalinkDoc.name, schema: PermalinkSchema },
      { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
    ],
    PermalinkRepository,
    SubjectAttributes.create({ userRole: UserRole.USER }),
  );

  async function seedPassport() {
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: randomUUID(),
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      }),
    });
    await ctx.getModuleRef().get(PassportRepository).save(passport);
    return passport;
  }

  async function seedConfig(passport: Passport) {
    const config = PresentationConfiguration.createForPassport({
      organizationId: passport.organizationId,
      referenceId: passport.id,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
    return config;
  }

  // (a) createPermalinksForConfigs marks the first presentation permalink primary
  it("(a) createPermalinksForConfigs marks the first presentation permalink as primary", async () => {
    const passport = await seedPassport();
    const config = await seedConfig(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const [created] = await service.createPermalinksForConfigs([config], passport.organizationId);

    expect(created.primary).toBe(true);
    // Persisted value should also be primary:true
    const persisted = await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(created.id);
    expect(persisted.primary).toBe(true);
  });

  // (a) ensureDefaultForPassport marks the first presentation permalink primary
  it("(a) ensureDefaultForPassport marks the first presentation permalink as primary", async () => {
    const passport = await seedPassport();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const permalink = await service.ensureDefaultForPassport(passport);

    expect(permalink.primary).toBe(true);
    const persisted = await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(permalink.id);
    expect(persisted.primary).toBe(true);
  });

  // (b) a second presentation permalink stays non-primary while the first stays primary
  it("(b) second presentation permalink stays non-primary; first stays primary", async () => {
    const passport = await seedPassport();
    const config1 = await seedConfig(passport);
    const config2 = await seedConfig(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const [first, second] = await service.createPermalinksForConfigs(
      [config1, config2],
      passport.organizationId,
    );

    expect(first.primary).toBe(true);
    expect(second.primary).toBe(false);
    const repo = ctx.getModuleRef().get(PermalinkRepository);
    expect((await repo.findOneOrFail(first.id)).primary).toBe(true);
    expect((await repo.findOneOrFail(second.id)).primary).toBe(false);
  });

  // (a) gs1-link permalink is never marked primary
  it("(a) a gs1-link permalink created via createPermalinksForConfigs is never marked primary", async () => {
    // gs1-link permalinks are not created via createPermalinksForConfigs in practice,
    // but createPermalinksForConfigs deals with config-based presentation permalinks only.
    // Test: if no presentation permalink exists yet, a manually seeded gs1-link should not
    // affect the primary assignment logic, and after calling createPermalinksForConfigs for a
    // presentation config the presentation permalink gets primary:true.
    const passport = await seedPassport();
    // Seed a gs1-link permalink manually (not through createPermalinksForConfigs)
    const gs1Link = Permalink.create({
      kind: "gs1-link" as const,
      uniqueProductIdentifierId: randomUUID(),
      presentationConfigurationId: null,
    });
    await ctx.getModuleRef().get(PermalinkRepository).save(gs1Link);

    const config = await seedConfig(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);
    const [presentation] = await service.createPermalinksForConfigs(
      [config],
      passport.organizationId,
    );

    // The presentation permalink should be primary; the gs1-link should NOT be primary
    expect(presentation.primary).toBe(true);
    const savedGs1Link = await ctx
      .getModuleRef()
      .get(PermalinkRepository)
      .findOneOrFail(gs1Link.id);
    expect(savedGs1Link.primary).toBe(false);
  });

  // (c) setPrimary moves the primary flag to the target
  it("(c) setPrimary flips primary to the target and clears the old primary", async () => {
    const passport = await seedPassport();
    const config1 = await seedConfig(passport);
    const config2 = await seedConfig(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const [first, second] = await service.createPermalinksForConfigs(
      [config1, config2],
      passport.organizationId,
    );
    expect(first.primary).toBe(true);
    expect(second.primary).toBe(false);

    await service.setPrimary(passport.id, second.id);

    const all = await ctx.getModuleRef().get(PermalinkRepository).findAllByPassportId(passport.id);
    const updatedFirst = all.find((p) => p.id === first.id)!;
    const updatedSecond = all.find((p) => p.id === second.id)!;
    expect(updatedFirst.primary).toBe(false);
    expect(updatedSecond.primary).toBe(true);
    expect(all.filter((p) => p.primary)).toHaveLength(1);
  });

  // (d) setPrimary rejects a gs1-link target with ConflictException
  it("(d) setPrimary throws ConflictException when target is a gs1-link permalink", async () => {
    const passport = await seedPassport();
    const gs1Link = Permalink.create({
      kind: "gs1-link" as const,
      uniqueProductIdentifierId: randomUUID(),
      presentationConfigurationId: null,
    });
    await ctx.getModuleRef().get(PermalinkRepository).save(gs1Link);

    // Seed a presentation config so findAllByPassportId has context
    const config = await seedConfig(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);
    await service.createPermalinksForConfigs([config], passport.organizationId);

    await expect(service.setPrimary(passport.id, gs1Link.id)).rejects.toThrow(ConflictException);
  });

  // (e) setPrimary rejects a permalink belonging to a different passport with NotFoundException
  it("(e) setPrimary throws NotFoundException when target belongs to a different passport", async () => {
    const passport1 = await seedPassport();
    const passport2 = await seedPassport();
    const config1 = await seedConfig(passport1);
    const config2 = await seedConfig(passport2);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const [permalink1] = await service.createPermalinksForConfigs(
      [config1],
      passport1.organizationId,
    );
    const [permalink2] = await service.createPermalinksForConfigs(
      [config2],
      passport2.organizationId,
    );

    // Try to set passport1's primary to permalink2 (which belongs to passport2)
    await expect(service.setPrimary(passport1.id, permalink2.id)).rejects.toThrow(
      NotFoundException,
    );
    // And ensure passport1's permalink1 is still primary
    const persisted1 = await ctx
      .getModuleRef()
      .get(PermalinkRepository)
      .findOneOrFail(permalink1.id);
    expect(persisted1.primary).toBe(true);
  });
});
