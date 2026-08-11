import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { getModelToken } from "@nestjs/mongoose";
import { NotFoundException } from "@nestjs/common";
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
    expect(permalink.passportId).toBe(passport.id);

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
      passportId: passport.id,
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
    const permalink = Permalink.create({
      passportId: passport.id,
      presentationConfigurationId: config.id,
      slug,
    });
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

  it("freezeAllForPassport freezes a bare and a UPI-bound open-dpp permalink in base/id form", async () => {
    const passport = await seedPublishedPassport();
    await seedBranding(passport.organizationId);
    const bare = Permalink.create({
      passportId: passport.id,
      organizationId: passport.organizationId,
    });
    const upiBound = Permalink.create({
      passportId: passport.id,
      uniqueProductIdentifierId: randomUUID(),
      organizationId: passport.organizationId,
    });
    const repo = ctx.getModuleRef().get(PermalinkRepository);
    await repo.save(bare);
    await repo.save(upiBound);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await service.freezeAllForPassport(passport);

    expect((await repo.findOneOrFail(bare.id)).publishedUrl).toBe(
      `http://localhost:3000/p/${bare.id}`,
    );
    expect((await repo.findOneOrFail(upiBound.id)).publishedUrl).toBe(
      `http://localhost:3000/p/${upiBound.id}`,
    );
  });

  it("freezeAllForPassport freezes a config-bound gs1-link in Digital Link form", async () => {
    const passport = await seedPublishedPassport();
    await seedBranding(passport.organizationId);
    const { config } = await seedConfigWithPermalink(passport);
    // A distinct serial: gtin+batch+serial is unique across the collection.
    const serial = `SER-${randomUUID().slice(0, 8)}`;
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: passport.id,
      gtin: "00012345678905",
      serial,
      organizationId: passport.organizationId,
    });
    await ctx.getModuleRef().get(UniqueProductIdentifierRepository).save(upi);
    const gs1Link = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      passportId: passport.id,
      uniqueProductIdentifierId: upi.uuid,
      presentationConfigurationId: config.id,
      baseUrl: "https://id.example.com",
      organizationId: passport.organizationId,
    });
    await ctx.getModuleRef().get(PermalinkRepository).save(gs1Link);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await service.freezeAllForPassport(passport);

    const frozen = await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(gs1Link.id);
    expect(frozen.publishedUrl).toBe(`https://id.example.com/01/00012345678905/21/${serial}`);
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
      passportId: passport.id,
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
    const passport = await seedPassport();
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      passportId: passport.id,
      uniqueProductIdentifierId: upi.uuid,
      baseUrl: "https://id.example.com",
      organizationId,
    });
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
    const passport = await seedPassport();
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      passportId: passport.id,
      uniqueProductIdentifierId: randomUUID(),
      baseUrl: "https://id.example.com",
      organizationId,
    });
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const { publicUrl } = await service.resolvePublicUrlWithFreeze(
      permalink,
      passport,
      null,
      "http://localhost:3000/p",
    );

    expect(publicUrl).toBe(`https://id.example.com/${permalink.id}`);
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
      passportId: randomUUID(),
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
      passportId: randomUUID(),
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

describe("PermalinkApplicationService.resolveToPassport (passport-first)", () => {
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

  async function seedConfig(passport: Passport) {
    const config = PresentationConfiguration.createForPassport({
      organizationId: passport.organizationId,
      referenceId: passport.id,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
    return config;
  }

  it("resolves a config-bound permalink to its passport, returning the BOUND config", async () => {
    const passport = await seedPassport({ published: true });
    const config = await seedConfig(passport);
    const permalink = Permalink.create({
      passportId: passport.id,
      presentationConfigurationId: config.id,
    });
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.resolveToPassport(permalink.id);

    expect(result.permalink.id).toBe(permalink.id);
    expect(result.passport.id).toBe(passport.id);
    expect(result.presentationConfiguration?.id).toBe(config.id);
  });

  it("resolves a bare permalink (no config) with presentationConfiguration null — standard view", async () => {
    const passport = await seedPassport({ published: true });
    const permalink = Permalink.create({ passportId: passport.id });
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.resolveToPassport(permalink.id);

    expect(result.passport.id).toBe(passport.id);
    expect(result.presentationConfiguration).toBeNull();
  });

  it("resolves a UPI-bound, null-config permalink — previously a 404", async () => {
    const passport = await seedPassport({ published: true });
    const permalink = Permalink.create({
      passportId: passport.id,
      uniqueProductIdentifierId: randomUUID(),
    });
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.resolveToPassport(permalink.id);

    expect(result.passport.id).toBe(passport.id);
    expect(result.presentationConfiguration).toBeNull();
  });

  it("resolves a gs1-link permalink (null config) to its passport", async () => {
    const passport = await seedPassport({ published: true });
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      passportId: passport.id,
      uniqueProductIdentifierId: randomUUID(),
      presentationConfigurationId: null,
    });
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.resolveToPassport(permalink.id);

    expect(result.passport.id).toBe(passport.id);
    expect(result.presentationConfiguration).toBeNull();
  });

  it("throws NotFoundException when passport is unpublished and access is anonymous", async () => {
    const passport = await seedPassport({ published: false });
    const permalink = Permalink.create({ passportId: passport.id });
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await expect(service.resolveToPassport(permalink.id, undefined)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("resolves for an org member when the passport is unpublished", async () => {
    const passport = await seedPassport({ published: false });
    const permalink = Permalink.create({ passportId: passport.id });
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.resolveToPassport(permalink.id, {
      organizationId: passport.organizationId,
      memberRole: "member" as never,
    });

    expect(result.passport.id).toBe(passport.id);
  });
});
