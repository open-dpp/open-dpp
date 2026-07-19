import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { getModelToken } from "@nestjs/mongoose";
import { ConflictException } from "@nestjs/common";
import { gs1DataAttributesPlainFactory } from "@open-dpp/testing";
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

describe("PermalinkApplicationService.createPresentationPermalink", () => {
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

  async function seedBranding(organizationId: string) {
    const model = ctx.getModuleRef().get<Model<BrandingDoc>>(getModelToken(BrandingDoc.name));
    await model.create({ organizationId });
  }

  // (a) for a passport with an existing primary, a new presentation permalink persists primary:false
  //     and leaves the primary intact
  it("(a) new permalink is non-primary and leaves the existing primary intact", async () => {
    const passport = await seedPassport();
    const config1 = await seedConfig(passport);
    const config2 = await seedConfig(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    // Create the first (primary) permalink
    const [primary] = await service.createPermalinksForConfigs([config1]);
    expect(primary.primary).toBe(true);

    // createPresentationPermalink for a second config must NOT steal the primary
    const second = await service.createPresentationPermalink(config2);

    expect(second.primary).toBe(false);
    // The original primary must still be primary in the DB
    const persistedPrimary = await ctx
      .getModuleRef()
      .get(PermalinkRepository)
      .findOneOrFail(primary.id);
    expect(persistedPrimary.primary).toBe(true);
    // The second must be non-primary in the DB
    const persistedSecond = await ctx
      .getModuleRef()
      .get(PermalinkRepository)
      .findOneOrFail(second.id);
    expect(persistedSecond.primary).toBe(false);
  });

  // (b) the new permalink references the given config, GS1 fields null
  it("(b) new permalink references the given config and has null GS1 fields", async () => {
    const passport = await seedPassport();
    const config1 = await seedConfig(passport);
    const config2 = await seedConfig(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    // Seed the primary
    await service.createPermalinksForConfigs([config1]);

    const second = await service.createPresentationPermalink(config2);

    expect(second.presentationConfigurationId).toBe(config2.id);
    expect(second.uniqueProductIdentifierId).toBeNull();
    expect(second.gs1DataAttributes).toBeNull();
  });

  // (c) if the passport is published, the new permalink is frozen on create
  it("(c) new permalink is frozen when the passport is already published", async () => {
    const passport = await seedPassport({ published: true });
    await seedBranding(passport.organizationId);
    const config1 = await seedConfig(passport);
    const config2 = await seedConfig(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    // Seed the primary
    await service.createPermalinksForConfigs([config1]);

    const second = await service.createPresentationPermalink(config2);

    expect(second.publishedUrl).not.toBeNull();
    // The published URL should follow the pattern base/id-or-slug
    expect(second.publishedUrl).toMatch(/^https?:\/\//);
  });
});

describe("PermalinkApplicationService.createGs1LinkPermalink", () => {
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

  // (a) given a GS1 UPI, creates a permalink with uniqueProductIdentifierId:upi.uuid,
  //     primary:false, optional presentationConfigurationId (null when omitted),
  //     gs1DataAttributes persisted
  it("(a) creates a gs1-link permalink with upiId, primary:false, optional fields", async () => {
    const upiUuid = randomUUID();
    const gs1DataAttributes = gs1DataAttributesPlainFactory.build();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createGs1LinkPermalink({
      uniqueProductIdentifierId: upiUuid,
      gs1DataAttributes,
      organizationId: randomUUID(),
    });

    expect(created.uniqueProductIdentifierId).toBe(upiUuid);
    expect(created.primary).toBe(false);
    expect(created.presentationConfigurationId).toBeNull();
    expect(created.gs1DataAttributes).toEqual(gs1DataAttributes);

    // Persisted correctly
    const persisted = await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(created.id);
    expect(persisted.uniqueProductIdentifierId).toBe(upiUuid);
    expect(persisted.primary).toBe(false);
    expect(persisted.presentationConfigurationId).toBeNull();
    expect(persisted.gs1DataAttributes).toEqual(gs1DataAttributes);
  });

  it("(a) optional fields default to null when omitted", async () => {
    const upiUuid = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createGs1LinkPermalink({
      uniqueProductIdentifierId: upiUuid,
      organizationId: randomUUID(),
    });

    expect(created.uniqueProductIdentifierId).toBe(upiUuid);
    expect(created.primary).toBe(false);
    expect(created.presentationConfigurationId).toBeNull();
    expect(created.gs1DataAttributes).toBeNull();
  });

  it("(a) accepts optional presentationConfigurationId", async () => {
    const upiUuid = randomUUID();
    const configId = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createGs1LinkPermalink({
      uniqueProductIdentifierId: upiUuid,
      presentationConfigurationId: configId,
      organizationId: randomUUID(),
    });

    expect(created.uniqueProductIdentifierId).toBe(upiUuid);
    expect(created.presentationConfigurationId).toBe(configId);
  });

  // (b) a SECOND gs1-link permalink for the SAME UPI → ConflictException
  it("(b) a second gs1-link permalink for the same UPI throws ConflictException", async () => {
    const upiUuid = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    // First one succeeds
    await service.createGs1LinkPermalink({
      uniqueProductIdentifierId: upiUuid,
      organizationId: randomUUID(),
    });

    // Second one for the same UPI must throw ConflictException
    await expect(
      service.createGs1LinkPermalink({
        uniqueProductIdentifierId: upiUuid,
        organizationId: randomUUID(),
      }),
    ).rejects.toThrow(ConflictException);
  });

  // (c) an invalid AI key/value surfaces as ValueError (delegated to domain/DTO)
  it("(c) invalid gs1DataAttributes AI key surfaces as ValueError", async () => {
    const upiUuid = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const { ValueError } = await import("@open-dpp/exception");
    await expect(
      service.createGs1LinkPermalink({
        uniqueProductIdentifierId: upiUuid,
        gs1DataAttributes: { "9999": "invalid-key" } as any,
        organizationId: randomUUID(),
      }),
    ).rejects.toThrow(ValueError);
  });

  // (d) a gs1-link permalink is never primary
  it("(d) gs1-link permalink is never primary, even when no other primary exists", async () => {
    const upiUuid = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createGs1LinkPermalink({
      uniqueProductIdentifierId: upiUuid,
      organizationId: randomUUID(),
    });

    expect(created.primary).toBe(false);
    const persisted = await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(created.id);
    expect(persisted.primary).toBe(false);
  });

  // (e) organizationId is stamped so org-scoped list/patch/delete work
  it("(e) persists the caller's organizationId", async () => {
    const organizationId = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createGs1LinkPermalink({
      uniqueProductIdentifierId: randomUUID(),
      organizationId,
    });

    const persisted = await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(created.id);
    expect(persisted.organizationId).toBe(organizationId);
  });

  // (f) regression: a stale FULL-unique presentationConfigurationId index (no partial
  // filter) makes every gs1-link insert (presentationConfigurationId: null) collide.
  // That E11000 must NOT be misreported as "gs1-link already exists for this UPI".
  it("(f) a duplicate-key on a different index is rethrown, not misreported as UPI conflict", async () => {
    const model = ctx.getModuleRef().get<Model<PermalinkDoc>>(getModelToken(PermalinkDoc.name));
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    // Simulate the legacy DB state: full unique index without the partial filter,
    // plus one existing doc occupying the null slot. (Clear the collection first —
    // the full unique index cannot build over earlier tests' null-config docs.)
    await model.collection.deleteMany({});
    await model.collection.dropIndex("presentationConfigurationId_1");
    await model.collection.createIndex(
      { presentationConfigurationId: 1 },
      { unique: true, name: "presentationConfigurationId_1" },
    );
    await service.createGs1LinkPermalink({
      uniqueProductIdentifierId: randomUUID(),
      organizationId: randomUUID(),
    });

    try {
      let thrown: unknown;
      try {
        await service.createGs1LinkPermalink({
          uniqueProductIdentifierId: randomUUID(),
          organizationId: randomUUID(),
        });
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeDefined();
      expect(thrown).not.toBeInstanceOf(ConflictException);
    } finally {
      // Restore the schema-defined partial index for the other tests.
      await model.syncIndexes();
    }
  });
});

describe("PermalinkApplicationService.deleteGs1LinkForUpi", () => {
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

  it("deletes the unpublished gs1-link permalink referencing the UPI", async () => {
    const upiUuid = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);
    const created = await service.createGs1LinkPermalink({
      uniqueProductIdentifierId: upiUuid,
      organizationId: randomUUID(),
    });

    await service.deleteGs1LinkForUpi(upiUuid);

    const repository = ctx.getModuleRef().get(PermalinkRepository);
    expect(await repository.findOne(created.id)).toBeUndefined();
  });

  it("is a no-op when the UPI has no gs1-link permalink", async () => {
    const service = ctx.getModuleRef().get(PermalinkApplicationService);
    await expect(service.deleteGs1LinkForUpi(randomUUID())).resolves.toBeUndefined();
  });

  it("throws ConflictException when the gs1-link permalink is published (frozen)", async () => {
    const upiUuid = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);
    const repository = ctx.getModuleRef().get(PermalinkRepository);
    const created = await service.createGs1LinkPermalink({
      uniqueProductIdentifierId: upiUuid,
      organizationId: randomUUID(),
    });
    await repository.save(created.withPublishedUrl("https://frozen.example.com/x"));

    await expect(service.deleteGs1LinkForUpi(upiUuid)).rejects.toThrow(ConflictException);
  });
});

describe("PermalinkApplicationService.deletePermalink", () => {
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

  async function seedPresentationPermalink(
    passport: Passport,
    options?: { primary?: boolean; publishedUrl?: string },
  ) {
    const config = await seedConfig(passport);
    let permalink = Permalink.create({
      presentationConfigurationId: config.id,
      primary: options?.primary ?? false,
    });
    if (options?.publishedUrl) {
      permalink = permalink.withPublishedUrl(options.publishedUrl);
    }
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
    return { config, permalink };
  }

  async function seedGs1LinkPermalink(options?: { publishedUrl?: string }) {
    let permalink = Permalink.create({
      kind: "gs1-link" as const,
      uniqueProductIdentifierId: randomUUID(),
      presentationConfigurationId: null,
      primary: false,
    });
    if (options?.publishedUrl) {
      permalink = permalink.withPublishedUrl(options.publishedUrl);
    }
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
    return permalink;
  }

  // (a) publishedUrl set → ConflictException, no delete
  it("(a) rejects deletion of a published permalink (publishedUrl set)", async () => {
    const passport = await seedPassport();
    const { permalink } = await seedPresentationPermalink(passport, {
      primary: true,
      publishedUrl: "https://example.com/p/foo",
    });
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await expect(service.deletePermalink(permalink.id)).rejects.toThrow(ConflictException);

    // Confirm it was NOT deleted
    const repo = ctx.getModuleRef().get(PermalinkRepository);
    const still = await repo.findOne(permalink.id);
    expect(still).toBeDefined();
  });

  // (b) passport's ONLY presentation permalink (primary) → rejected
  it("(b) rejects deletion of the last presentation permalink for a passport", async () => {
    const passport = await seedPassport();
    const { permalink } = await seedPresentationPermalink(passport, { primary: true });
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await expect(service.deletePermalink(permalink.id)).rejects.toThrow(ConflictException);

    // Not deleted
    const repo = ctx.getModuleRef().get(PermalinkRepository);
    expect(await repo.findOne(permalink.id)).toBeDefined();
  });

  // (c) PRIMARY presentation permalink while another non-primary exists → rejected
  it("(c) rejects deletion of the primary presentation permalink when another exists", async () => {
    const passport = await seedPassport();
    const { permalink: primary } = await seedPresentationPermalink(passport, { primary: true });
    await seedPresentationPermalink(passport, { primary: false });
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await expect(service.deletePermalink(primary.id)).rejects.toThrow(ConflictException);

    // Primary still exists
    const repo = ctx.getModuleRef().get(PermalinkRepository);
    expect(await repo.findOne(primary.id)).toBeDefined();
  });

  // (d) non-primary, unpublished presentation permalink → deletes
  it("(d) deletes a non-primary unpublished presentation permalink", async () => {
    const passport = await seedPassport();
    await seedPresentationPermalink(passport, { primary: true });
    const { permalink: nonPrimary } = await seedPresentationPermalink(passport, { primary: false });
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await service.deletePermalink(nonPrimary.id);

    // Confirmed deleted
    const repo = ctx.getModuleRef().get(PermalinkRepository);
    expect(await repo.findOne(nonPrimary.id)).toBeUndefined();
  });

  // (e) unpublished gs1-link permalink → deletes regardless of primary flag
  it("(e) deletes an unpublished gs1-link permalink", async () => {
    const gs1Link = await seedGs1LinkPermalink();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await service.deletePermalink(gs1Link.id);

    const repo = ctx.getModuleRef().get(PermalinkRepository);
    expect(await repo.findOne(gs1Link.id)).toBeUndefined();
  });

  // (f) published gs1-link permalink → ConflictException
  it("(f) rejects deletion of a published gs1-link permalink", async () => {
    const gs1Link = await seedGs1LinkPermalink({
      publishedUrl: "https://id.example.com/01/04006381333931",
    });
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await expect(service.deletePermalink(gs1Link.id)).rejects.toThrow(ConflictException);

    const repo = ctx.getModuleRef().get(PermalinkRepository);
    expect(await repo.findOne(gs1Link.id)).toBeDefined();
  });
});
