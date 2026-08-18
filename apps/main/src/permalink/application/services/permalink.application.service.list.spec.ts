import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { PermalinkKind } from "@open-dpp/dto";
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
import { Pagination } from "../../../pagination/pagination";
import { Permalink } from "../../domain/permalink";
import { PermalinkRepository } from "../../infrastructure/permalink.repository";
import { PermalinkDoc, PermalinkSchema } from "../../infrastructure/permalink.schema";
import { UniqueProductIdentifier } from "../../../unique-product-identifier/domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import { InstanceSettingsModule } from "../../../instance-settings/instance-settings.module";
import { PermalinkModule } from "../../permalink.module";
import { PermalinkApplicationService } from "./permalink.application.service";

describe("PermalinkApplicationService.listByOrganization", () => {
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

  async function seedGs1Permalink(organizationId: string) {
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      passportId: randomUUID(),
      uniqueProductIdentifierId: randomUUID(),
      presentationConfigurationId: null,
      gs1DataAttributes: null,
      organizationId,
    });
    return await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
  }

  it("threads limit/cursor to the repository and pages without overlap", async () => {
    const organizationId = randomUUID();
    await seedGs1Permalink(organizationId);
    await seedGs1Permalink(organizationId);
    await seedGs1Permalink(organizationId);

    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const page1 = await service.listByOrganization(organizationId, Pagination.create({ limit: 2 }));
    expect(page1.items).toHaveLength(2);
    expect(page1.cursor).not.toBeNull();

    const page2 = await service.listByOrganization(
      organizationId,
      Pagination.create({ limit: 2, cursor: page1.cursor! }),
    );
    expect(page2.items).toHaveLength(1);

    const page1Ids = page1.items.map((entry) => entry.permalink.id);
    const page2Ids = page2.items.map((entry) => entry.permalink.id);
    expect(page1Ids.some((id) => page2Ids.includes(id))).toBe(false);
  });

  it("returns an empty page with a null cursor for an org with no permalinks", async () => {
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.listByOrganization(randomUUID());

    expect(result.items).toEqual([]);
    expect(result.cursor).toBeNull();
  });

  async function seedResolvableGs1Permalink(organizationId: string, gtin: string) {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({
      referenceId,
      gtin,
      organizationId,
    });
    await ctx.getModuleRef().get(UniqueProductIdentifierRepository).save(upi);
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      passportId: referenceId,
      uniqueProductIdentifierId: upi.uuid,
      baseUrl: "https://id.example.com",
      organizationId,
    });
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
    return { upi, permalink };
  }

  it("renders the live GS1 Digital Link URL for an unfrozen gs1-link whose UPI resolves", async () => {
    const organizationId = randomUUID();
    const { permalink } = await seedResolvableGs1Permalink(organizationId, "00036000291452");
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.listByOrganization(organizationId);

    const entry = result.items.find((e) => e.permalink.id === permalink.id);
    expect(entry?.publicUrl).toBe("https://id.example.com/01/00036000291452");
  });

  it("batch-loads UPI identities — one findByIds query per page, no N+1", async () => {
    const organizationId = randomUUID();
    await seedResolvableGs1Permalink(organizationId, "00075678164125");
    await seedResolvableGs1Permalink(organizationId, "88000000000107");
    const upiRepo = ctx.getModuleRef().get(UniqueProductIdentifierRepository);
    const findByIds = jest.spyOn(upiRepo, "findByIds");
    const findOne = jest.spyOn(upiRepo, "findOne");
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    await service.listByOrganization(organizationId);

    expect(findByIds).toHaveBeenCalledTimes(1);
    expect(findOne).not.toHaveBeenCalled();
    findByIds.mockRestore();
    findOne.mockRestore();
  });

  it("falls back to the presentation form when a gs1-link's UPI is missing", async () => {
    const organizationId = randomUUID();
    const orphan = await seedGs1Permalink(organizationId);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.listByOrganization(organizationId);

    const entry = result.items.find((e) => e.permalink.id === orphan.id);
    expect(entry?.publicUrl.endsWith(`/${orphan.id}`)).toBe(true);
  });
});

describe("PermalinkApplicationService.getPermalinkSummariesByUpiIds", () => {
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

  async function seedGs1Link(organizationId: string, upiUuid: string) {
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      passportId: randomUUID(),
      uniqueProductIdentifierId: upiUuid,
      presentationConfigurationId: null,
      gs1DataAttributes: null,
      organizationId,
    });
    return await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
  }

  it("returns an empty map for empty input", async () => {
    const service = ctx.getModuleRef().get(PermalinkApplicationService);
    const result = await service.getPermalinkSummariesByUpiIds([], randomUUID());
    expect(result.size).toBe(0);
  });

  it("returns summaries keyed by UPI uuid with a resolved publicUrl ending in the permalink id", async () => {
    const organizationId = randomUUID();
    const upiA = randomUUID();
    const upiB = randomUUID();
    const linkA = await seedGs1Link(organizationId, upiA);
    await seedGs1Link(organizationId, upiB);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.getPermalinkSummariesByUpiIds([upiA, upiB], organizationId);

    expect(result.size).toBe(2);
    const summaryA = result.get(upiA);
    expect(summaryA?.id).toBe(linkA.id);
    expect(summaryA?.publicUrl).toMatch(/^https?:\/\//);
    expect(summaryA?.publicUrl.endsWith(`/${linkA.id}`)).toBe(true);
  });

  it("prefers the frozen publishedUrl over the computed publicUrl", async () => {
    const organizationId = randomUUID();
    const upiUuid = randomUUID();
    const link = await seedGs1Link(organizationId, upiUuid);
    const frozen = link.withPublishedUrl("https://frozen.example.com/my-link");
    await ctx.getModuleRef().get(PermalinkRepository).save(frozen);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.getPermalinkSummariesByUpiIds([upiUuid], organizationId);

    expect(result.get(upiUuid)?.publicUrl).toBe("https://frozen.example.com/my-link");
  });

  it("omits UPIs without a gs1-link permalink", async () => {
    const organizationId = randomUUID();
    const upiWithLink = randomUUID();
    await seedGs1Link(organizationId, upiWithLink);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.getPermalinkSummariesByUpiIds(
      [upiWithLink, randomUUID()],
      organizationId,
    );

    expect(result.size).toBe(1);
    expect(result.has(upiWithLink)).toBe(true);
  });

  it("renders the live GS1 Digital Link URL when the referenced UPI resolves", async () => {
    const organizationId = randomUUID();
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({
      referenceId,
      gtin: "88000000000206",
      organizationId,
    });
    await ctx.getModuleRef().get(UniqueProductIdentifierRepository).save(upi);
    const link = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      passportId: referenceId,
      uniqueProductIdentifierId: upi.uuid,
      baseUrl: "https://id.example.com",
      organizationId,
    });
    await ctx.getModuleRef().get(PermalinkRepository).save(link);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.getPermalinkSummariesByUpiIds([upi.uuid], organizationId);

    expect(result.get(upi.uuid)?.publicUrl).toBe("https://id.example.com/01/88000000000206");
  });
});

describe("PermalinkApplicationService.listByPassport", () => {
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

  async function seedPresentationPermalink(passport: Passport) {
    const config = PresentationConfiguration.createForPassport({
      organizationId: passport.organizationId,
      referenceId: passport.id,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
    const permalink = Permalink.create({
      passportId: passport.id,
      presentationConfigurationId: config.id,
      organizationId: passport.organizationId,
    });
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
    return permalink;
  }

  it("returns the passport's permalinks with assembled publicUrl + fallback metadata", async () => {
    const passport = await seedPassport();
    const p1 = await seedPresentationPermalink(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.listByPassport(passport.id);

    expect(result.items).toHaveLength(1);
    const entry = result.items[0];
    expect(entry.permalink.id).toBe(p1.id);
    expect(entry.publicUrl).toMatch(/^https?:\/\//);
    expect(entry.fallbackBaseUrl).toMatch(/^https?:\/\//);
    expect(["branding", "instance"]).toContain(entry.fallbackBaseUrlSource);
  });

  it("threads limit/cursor to the repository and pages without overlap", async () => {
    const passport = await seedPassport();
    await seedPresentationPermalink(passport);
    await seedPresentationPermalink(passport);
    await seedPresentationPermalink(passport);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const page1 = await service.listByPassport(passport.id, Pagination.create({ limit: 2 }));
    expect(page1.items).toHaveLength(2);
    expect(page1.cursor).not.toBeNull();

    const page2 = await service.listByPassport(
      passport.id,
      Pagination.create({ limit: 2, cursor: page1.cursor! }),
    );
    expect(page2.items).toHaveLength(1);

    const ids1 = page1.items.map((entry) => entry.permalink.id);
    const ids2 = page2.items.map((entry) => entry.permalink.id);
    expect(ids1.some((id) => ids2.includes(id))).toBe(false);
  });

  it("returns an empty page with a null cursor for a passport with no permalinks", async () => {
    const passport = await seedPassport();
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.listByPassport(passport.id);

    expect(result.items).toEqual([]);
    expect(result.cursor).toBeNull();
  });

  it("renders the live GS1 Digital Link URL for a gs1-link surfaced via the UPI join", async () => {
    const passport = await seedPassport();
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: passport.id,
      gtin: "88000000000305",
      organizationId: passport.organizationId,
    });
    await ctx.getModuleRef().get(UniqueProductIdentifierRepository).save(upi);
    const link = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      passportId: passport.id,
      uniqueProductIdentifierId: upi.uuid,
      baseUrl: "https://id.example.com",
      organizationId: passport.organizationId,
    });
    await ctx.getModuleRef().get(PermalinkRepository).save(link);
    const service = ctx.getModuleRef().get(PermalinkApplicationService);

    const result = await service.listByPassport(passport.id);

    const entry = result.items.find((e) => e.permalink.id === link.id);
    expect(entry?.publicUrl).toBe("https://id.example.com/01/88000000000305");
  });
});
