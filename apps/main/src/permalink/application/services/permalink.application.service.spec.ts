import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { getModelToken } from "@nestjs/mongoose";
import { PresentationReferenceType } from "@open-dpp/dto";
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

  // The unique-index race-recovery test relies on the unique index on
  // `presentationConfigurationId` actually being enforced. Mongoose builds indexes
  // asynchronously after connect, so under the full parallel suite the build can lag — a
  // duplicate insert then succeeds instead of rejecting, silently skipping the recovery path.
  // Force the indexes to exist before any test runs (each suite has its own isolated DB).
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
        referenceType: PresentationReferenceType.Passport,
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
        referenceType: PresentationReferenceType.Passport,
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

    const [created] = await service.createPermalinksForConfigs([config]);

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

  it("createPermalinksForConfigs recovers idempotently when a concurrent create wins the unique-index race", async () => {
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

    const [result] = await service.createPermalinksForConfigs([config]);

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

    const [created] = await service.createPermalinksForConfigs([config]);

    expect(created.publishedUrl).toBeNull();
  });
});
