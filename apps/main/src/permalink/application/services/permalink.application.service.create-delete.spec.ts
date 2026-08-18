import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "@jest/globals";
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

const testModuleConfig = {
  imports: [PermalinkModule, PresentationConfigurationsModule, InstanceSettingsModule],
  providers: [
    PermalinkRepository,
    PermalinkApplicationService,
    PassportRepository,
    BrandingRepository,
    PresentationConfigurationRepository,
  ],
};

const testModels = [
  { name: PassportDoc.name, schema: PassportSchema },
  { name: BrandingDoc.name, schema: BrandingSchema },
  { name: PermalinkDoc.name, schema: PermalinkSchema },
  { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
  { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
];

describe("PermalinkApplicationService.createOpenDppPermalink", () => {
  const ctx = createAasTestContext(
    "/p",
    "/p",
    testModuleConfig,
    testModels,
    PermalinkRepository,
    SubjectAttributes.create({ userRole: UserRole.USER }),
  );

  beforeAll(async () => {
    await ctx
      .getModuleRef()
      .get<Model<PermalinkDoc>>(getModelToken(PermalinkDoc.name))
      .syncIndexes();
  });

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

  it("creates a bare permalink (no config, no UPI) bound to the passport", async () => {
    const passport = await seedPassport();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createOpenDppPermalink({
      passportId: passport.id,
      organizationId: passport.organizationId,
    });

    expect(created.kind).toBe("open-dpp");
    expect(created.passportId).toBe(passport.id);
    expect(created.presentationConfigurationId).toBeNull();
    expect(created.uniqueProductIdentifierId).toBeNull();

    const persisted = await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(created.id);
    expect(persisted.passportId).toBe(passport.id);
    expect(persisted.organizationId).toBe(passport.organizationId);
  });

  it("creates a config-bound permalink", async () => {
    const passport = await seedPassport();
    const config = await seedConfig(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createOpenDppPermalink({
      passportId: passport.id,
      organizationId: passport.organizationId,
      presentationConfigurationId: config.id,
    });

    expect(created.presentationConfigurationId).toBe(config.id);
    expect(created.gs1DataAttributes).toBeNull();
  });

  it("creates a UPI-bound permalink", async () => {
    const passport = await seedPassport();
    const upiId = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createOpenDppPermalink({
      passportId: passport.id,
      organizationId: passport.organizationId,
      uniqueProductIdentifierId: upiId,
    });

    expect(created.uniqueProductIdentifierId).toBe(upiId);
    expect(created.presentationConfigurationId).toBeNull();
  });

  it("allows multiple permalinks bound to the same UPI (open-dpp kind is not UPI-unique)", async () => {
    const passport = await seedPassport();
    const upiId = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await service.createOpenDppPermalink({
      passportId: passport.id,
      organizationId: passport.organizationId,
      uniqueProductIdentifierId: upiId,
    });
    await expect(
      service.createOpenDppPermalink({
        passportId: passport.id,
        organizationId: passport.organizationId,
        uniqueProductIdentifierId: upiId,
      }),
    ).resolves.toBeDefined();
  });

  it("allows multiple permalinks sharing one config", async () => {
    const passport = await seedPassport();
    const config = await seedConfig(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await service.createOpenDppPermalink({
      passportId: passport.id,
      organizationId: passport.organizationId,
      presentationConfigurationId: config.id,
    });
    await expect(
      service.createOpenDppPermalink({
        passportId: passport.id,
        organizationId: passport.organizationId,
        presentationConfigurationId: config.id,
      }),
    ).resolves.toBeDefined();
  });

  it("maps a duplicate slug to ConflictException", async () => {
    const passport = await seedPassport();
    const slug = `dup-${randomUUID().slice(0, 8)}`;
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await service.createOpenDppPermalink({
      passportId: passport.id,
      organizationId: passport.organizationId,
      slug,
    });
    await expect(
      service.createOpenDppPermalink({
        passportId: passport.id,
        organizationId: passport.organizationId,
        slug,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it("freezes the new permalink when the passport is already published", async () => {
    const passport = await seedPassport({ published: true });
    await seedBranding(passport.organizationId);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createOpenDppPermalink({
      passportId: passport.id,
      organizationId: passport.organizationId,
    });

    expect(created.publishedUrl).not.toBeNull();
    expect(created.publishedUrl).toMatch(/^https?:\/\//);
  });
});

describe("PermalinkApplicationService.createPermalinksForConfigs", () => {
  const ctx = createAasTestContext(
    "/p",
    "/p",
    testModuleConfig,
    testModels,
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

  it("creates one permalink per config, stamped with passportId and organizationId", async () => {
    const passport = await seedPassport();
    const config1 = await seedConfig(passport);
    const config2 = await seedConfig(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createPermalinksForConfigs(
      [config1, config2],
      passport.organizationId,
    );

    expect(created).toHaveLength(2);
    for (const permalink of created) {
      expect(permalink.passportId).toBe(passport.id);
      expect(permalink.organizationId).toBe(passport.organizationId);
      expect(permalink.kind).toBe("open-dpp");
    }
    expect(created.map((p) => p.presentationConfigurationId).sort()).toEqual(
      [config1.id, config2.id].sort(),
    );
  });

  it("returns the existing permalink instead of creating a second one for the same config", async () => {
    const passport = await seedPassport();
    const config = await seedConfig(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const [first] = await service.createPermalinksForConfigs([config], passport.organizationId);
    const [second] = await service.createPermalinksForConfigs([config], passport.organizationId);

    expect(second.id).toBe(first.id);
  });
});

describe("PermalinkApplicationService.createGs1LinkPermalink", () => {
  const ctx = createAasTestContext(
    "/p",
    "/p",
    testModuleConfig,
    testModels,
    PermalinkRepository,
    SubjectAttributes.create({ userRole: UserRole.USER }),
  );

  it("(a) creates a gs1-link permalink with upiId, passportId, optional fields", async () => {
    const upiUuid = randomUUID();
    const passportId = randomUUID();
    const gs1DataAttributes = gs1DataAttributesPlainFactory.build();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createGs1LinkPermalink({
      passportId,
      uniqueProductIdentifierId: upiUuid,
      gs1DataAttributes,
      organizationId: randomUUID(),
    });

    expect(created.uniqueProductIdentifierId).toBe(upiUuid);
    expect(created.passportId).toBe(passportId);
    expect(created.presentationConfigurationId).toBeNull();
    expect(created.gs1DataAttributes).toEqual(gs1DataAttributes);

    const persisted = await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(created.id);
    expect(persisted.uniqueProductIdentifierId).toBe(upiUuid);
    expect(persisted.passportId).toBe(passportId);
    expect(persisted.presentationConfigurationId).toBeNull();
    expect(persisted.gs1DataAttributes).toEqual(gs1DataAttributes);
  });

  it("(a) optional fields default to null when omitted", async () => {
    const upiUuid = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createGs1LinkPermalink({
      passportId: randomUUID(),
      uniqueProductIdentifierId: upiUuid,
      organizationId: randomUUID(),
    });

    expect(created.uniqueProductIdentifierId).toBe(upiUuid);
    expect(created.presentationConfigurationId).toBeNull();
    expect(created.gs1DataAttributes).toBeNull();
  });

  it("(a) accepts optional presentationConfigurationId", async () => {
    const upiUuid = randomUUID();
    const configId = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createGs1LinkPermalink({
      passportId: randomUUID(),
      uniqueProductIdentifierId: upiUuid,
      presentationConfigurationId: configId,
      organizationId: randomUUID(),
    });

    expect(created.uniqueProductIdentifierId).toBe(upiUuid);
    expect(created.presentationConfigurationId).toBe(configId);
  });

  it("(b) a second gs1-link permalink for the same UPI throws ConflictException", async () => {
    const upiUuid = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await service.createGs1LinkPermalink({
      passportId: randomUUID(),
      uniqueProductIdentifierId: upiUuid,
      organizationId: randomUUID(),
    });

    await expect(
      service.createGs1LinkPermalink({
        passportId: randomUUID(),
        uniqueProductIdentifierId: upiUuid,
        organizationId: randomUUID(),
      }),
    ).rejects.toThrow(ConflictException);
  });

  it("(c) invalid gs1DataAttributes AI key surfaces as ValueError", async () => {
    const upiUuid = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const { ValueError } = await import("@open-dpp/exception");
    await expect(
      service.createGs1LinkPermalink({
        passportId: randomUUID(),
        uniqueProductIdentifierId: upiUuid,
        gs1DataAttributes: { "9999": "invalid-key" } as any,
        organizationId: randomUUID(),
      }),
    ).rejects.toThrow(ValueError);
  });

  it("(e) persists the caller's organizationId", async () => {
    const organizationId = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const created = await service.createGs1LinkPermalink({
      passportId: randomUUID(),
      uniqueProductIdentifierId: randomUUID(),
      organizationId,
    });

    const persisted = await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(created.id);
    expect(persisted.organizationId).toBe(organizationId);
  });

  it("(f) a duplicate-key on a different index is rethrown, not misreported as UPI conflict", async () => {
    const model = ctx.getModuleRef().get<Model<PermalinkDoc>>(getModelToken(PermalinkDoc.name));
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await model.collection.deleteMany({});
    await model.collection.createIndex(
      { presentationConfigurationId: 1 },
      { unique: true, name: "presentationConfigurationId_1" },
    );
    await service.createGs1LinkPermalink({
      passportId: randomUUID(),
      uniqueProductIdentifierId: randomUUID(),
      organizationId: randomUUID(),
    });

    try {
      let thrown: unknown;
      try {
        await service.createGs1LinkPermalink({
          passportId: randomUUID(),
          uniqueProductIdentifierId: randomUUID(),
          organizationId: randomUUID(),
        });
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeDefined();
      expect(thrown).not.toBeInstanceOf(ConflictException);
    } finally {
      await model.syncIndexes();
    }
  });
});

describe("PermalinkApplicationService.deleteGs1LinkForUpi", () => {
  const ctx = createAasTestContext(
    "/p",
    "/p",
    testModuleConfig,
    testModels,
    PermalinkRepository,
    SubjectAttributes.create({ userRole: UserRole.USER }),
  );

  it("deletes the unpublished gs1-link permalink referencing the UPI", async () => {
    const upiUuid = randomUUID();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);
    const created = await service.createGs1LinkPermalink({
      passportId: randomUUID(),
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
      passportId: randomUUID(),
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
    testModuleConfig,
    testModels,
    PermalinkRepository,
    SubjectAttributes.create({ userRole: UserRole.USER }),
  );

  async function seedPermalink(options?: { publishedUrl?: string }) {
    let permalink = Permalink.create({
      passportId: randomUUID(),
      presentationConfigurationId: randomUUID(),
    });
    if (options?.publishedUrl) {
      permalink = permalink.withPublishedUrl(options.publishedUrl);
    }
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
    return permalink;
  }

  it("rejects deletion of a published permalink (publishedUrl set)", async () => {
    const permalink = await seedPermalink({ publishedUrl: "https://example.com/p/foo" });
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await expect(service.deletePermalink(permalink.id)).rejects.toThrow(ConflictException);

    const repo = ctx.getModuleRef().get(PermalinkRepository);
    expect(await repo.findOne(permalink.id)).toBeDefined();
  });

  it("deletes a passport's last (and only) permalink — the standard view keeps the passport reachable", async () => {
    const permalink = await seedPermalink();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await service.deletePermalink(permalink.id);

    const repo = ctx.getModuleRef().get(PermalinkRepository);
    expect(await repo.findOne(permalink.id)).toBeUndefined();
  });

  it("deletes an unpublished gs1-link permalink", async () => {
    const gs1Link = Permalink.create({
      kind: "gs1-link" as const,
      passportId: randomUUID(),
      uniqueProductIdentifierId: randomUUID(),
      presentationConfigurationId: null,
    });
    await ctx.getModuleRef().get(PermalinkRepository).save(gs1Link);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await service.deletePermalink(gs1Link.id);

    const repo = ctx.getModuleRef().get(PermalinkRepository);
    expect(await repo.findOne(gs1Link.id)).toBeUndefined();
  });

  it("rejects deletion of a published gs1-link permalink", async () => {
    let gs1Link = Permalink.create({
      kind: "gs1-link" as const,
      passportId: randomUUID(),
      uniqueProductIdentifierId: randomUUID(),
      presentationConfigurationId: null,
    });
    gs1Link = gs1Link.withPublishedUrl("https://id.example.com/01/04006381333931");
    await ctx.getModuleRef().get(PermalinkRepository).save(gs1Link);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await expect(service.deletePermalink(gs1Link.id)).rejects.toThrow(ConflictException);

    const repo = ctx.getModuleRef().get(PermalinkRepository);
    expect(await repo.findOne(gs1Link.id)).toBeDefined();
  });
});
