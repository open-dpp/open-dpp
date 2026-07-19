import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { LatestApiVersionWithPrefixDto, PermalinkKind } from "@open-dpp/dto";
import request from "supertest";
import { Environment } from "../../aas/domain/environment";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import {
  ConceptDescriptionDoc,
  ConceptDescriptionSchema,
} from "../../aas/infrastructure/schemas/concept-description.schema";
import { createAasTestContext } from "../../aas/presentation/aas.test.context";

import { BrandingRepository } from "../../branding/infrastructure/branding.repository";
import { BrandingDoc, BrandingSchema } from "../../branding/infrastructure/branding.schema";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
} from "../../digital-product-document/domain/digital-product-document-status";
import { ORGANIZATION_ID_HEADER } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../passports/infrastructure/passport.schema";
import { PresentationConfiguration } from "../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { PresentationConfigurationsModule } from "../../presentation-configurations/presentation-configurations.module";
import { Permalink } from "../domain/permalink";
import { PermalinkRepository } from "../infrastructure/permalink.repository";
import { PermalinkDoc, PermalinkSchema } from "../infrastructure/permalink.schema";
import { InstanceSettingsModule } from "../../instance-settings/instance-settings.module";
import { PermalinkModule } from "../permalink.module";
import { PermalinkApplicationService } from "../application/services/permalink.application.service";
import { UniqueProductIdentifier } from "../../unique-product-identifier/domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierModule } from "../../unique-product-identifier/unique.product.identifier.module";

describe("PermalinkController", () => {
  const basePathV1 = "/v1/p";
  const basePathV2 = "/v2/p";

  const ctx = createAasTestContext(
    basePathV1,
    basePathV2,
    {
      imports: [
        PermalinkModule,
        PresentationConfigurationsModule,
        InstanceSettingsModule,
        UniqueProductIdentifierModule,
      ],
      providers: [
        PermalinkRepository,
        PermalinkApplicationService,
        PassportRepository,
        BrandingRepository,
        PresentationConfigurationRepository,
        UniqueProductIdentifierRepository,
      ],
    },
    [
      { name: PassportDoc.name, schema: PassportSchema },
      { name: BrandingDoc.name, schema: BrandingSchema },
      { name: PermalinkDoc.name, schema: PermalinkSchema },
      { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
      { name: UniqueProductIdentifierDoc.name, schema: UniqueProductIdentifierSchema },
    ],
    PermalinkRepository,
    SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.OWNER }),
  );

  // ---------------------------------------------------------------------------
  // Slice 46 — POST /permalinks (create gs1-link or presentation)
  // ---------------------------------------------------------------------------
  describe("POST /permalinks", () => {
    async function createPassportWithConfig(orgId: string) {
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: orgId,
        environment: Environment.create({
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        }),
        lastStatusChange: DigitalProductDocumentStatusChange.create({
          previousStatus: DigitalProductDocumentStatus.Draft,
          currentStatus: DigitalProductDocumentStatus.Published,
        }),
      });
      const config = PresentationConfiguration.createForPassport({
        organizationId: orgId,
        referenceId: passport.id,
      });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
      return { passport, config };
    }

    async function createGs1Upi(orgId: string, referenceId: string) {
      const upi = UniqueProductIdentifier.createGs1({
        referenceId,
        gtin: "04006381333931",
        batch: `LOT-${randomUUID().slice(0, 8)}`,
        serial: `SN-${randomUUID().slice(0, 8)}`,
        organizationId: orgId,
      });
      await ctx.getModuleRef().get(UniqueProductIdentifierRepository).save(upi);
      return upi;
    }

    it("(a) returns 201 when creating a gs1-link permalink for a known UPI", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { passport } = await createPassportWithConfig(org.id);
      const upi = await createGs1Upi(org.id, passport.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .post(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({
          kind: PermalinkKind.GS1_LINK,
          uniqueProductIdentifierId: upi.uuid,
        });

      expect(response.status).toEqual(201);
      expect(response.body.kind).toEqual(PermalinkKind.GS1_LINK);
      expect(response.body.uniqueProductIdentifierId).toEqual(upi.uuid);
      expect(response.body.id).toBeDefined();

      // The permalink must be stamped with the passport's organization —
      // otherwise it never shows in the org list and PATCH/DELETE 403.
      const persisted = await ctx
        .getModuleRef()
        .get(PermalinkRepository)
        .findOneOrFail(response.body.id);
      expect(persisted.organizationId).toEqual(org.id);
    });

    it("(a-baseUrl) persists a custom baseUrl supplied when creating a gs1-link permalink", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { passport } = await createPassportWithConfig(org.id);
      const upi = await createGs1Upi(org.id, passport.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .post(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({
          kind: PermalinkKind.GS1_LINK,
          uniqueProductIdentifierId: upi.uuid,
          baseUrl: "https://custom.example.com",
        });

      expect(response.status).toEqual(201);
      expect(response.body.baseUrl).toEqual("https://custom.example.com");
    });

    it("(b) returns 409 when a second gs1-link is created for the same UPI", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { passport } = await createPassportWithConfig(org.id);
      const upi = await createGs1Upi(org.id, passport.id);

      await request(ctx.globals().app.getHttpServer())
        .post(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ kind: PermalinkKind.GS1_LINK, uniqueProductIdentifierId: upi.uuid });

      const response = await request(ctx.globals().app.getHttpServer())
        .post(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ kind: PermalinkKind.GS1_LINK, uniqueProductIdentifierId: upi.uuid });

      expect(response.status).toEqual(409);
    });

    it("(c) returns 201 when creating an additional presentation permalink (non-primary)", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { config } = await createPassportWithConfig(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .post(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({
          kind: PermalinkKind.PRESENTATION,
          presentationConfigurationId: config.id,
        });

      expect(response.status).toEqual(201);
      expect(response.body.kind).toEqual(PermalinkKind.PRESENTATION);
      expect(response.body.id).toBeDefined();
    });

    it("(d) returns 403 for cross-org / non-member request", async () => {
      const { org: ownerOrg } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const outsider = await ctx.globals().betterAuthHelper.createOrganizationAndUserWithCookie();
      const { passport } = await createPassportWithConfig(ownerOrg.id);
      const upi = await createGs1Upi(ownerOrg.id, passport.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .post(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", outsider.userCookie)
        .set(ORGANIZATION_ID_HEADER, outsider.org.id)
        .send({ kind: PermalinkKind.GS1_LINK, uniqueProductIdentifierId: upi.uuid });

      expect(response.status).toEqual(403);
    });

    it("(e) returns 400 for invalid gs1DataAttributes", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { passport } = await createPassportWithConfig(org.id);
      const upi = await createGs1Upi(org.id, passport.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .post(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({
          kind: PermalinkKind.GS1_LINK,
          uniqueProductIdentifierId: upi.uuid,
          gs1DataAttributes: { "99zz": "bad-ai-key" },
        });

      expect(response.status).toEqual(400);
    });

    it("(f) returns 400 when the org header is missing", async () => {
      const { userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(ctx.globals().app.getHttpServer())
        .post(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", userCookie)
        .send({ kind: PermalinkKind.GS1_LINK, uniqueProductIdentifierId: randomUUID() });

      expect(response.status).toEqual(400);
    });
  });

  // ---------------------------------------------------------------------------
  // Slice 47 — PATCH /permalinks/:id (extend to gs1 fields; keep slug/baseUrl)
  // ---------------------------------------------------------------------------
  describe("PATCH /permalinks/:id", () => {
    async function createGs1LinkPermalinkInOrg(orgId: string) {
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: orgId,
        environment: Environment.create({
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        }),
      });
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: passport.id,
        gtin: "04006381333931",
        batch: `LOT-${randomUUID().slice(0, 8)}`,
        serial: `SN-${randomUUID().slice(0, 8)}`,
        organizationId: orgId,
      });
      const gs1Permalink = Permalink.create({
        kind: PermalinkKind.GS1_LINK,
        uniqueProductIdentifierId: upi.uuid,
        presentationConfigurationId: null,
        gs1DataAttributes: null,
        primary: false,
        organizationId: orgId,
      });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      await ctx.getModuleRef().get(UniqueProductIdentifierRepository).save(upi);
      await ctx.getModuleRef().get(PermalinkRepository).save(gs1Permalink);
      return { passport, upi, permalink: gs1Permalink };
    }

    async function createPresentationPermalinkInOrg(
      orgId: string,
      options: { published?: boolean; slug?: string | null } = {},
    ) {
      const lastStatusChange =
        options.published === false
          ? DigitalProductDocumentStatusChange.create({})
          : DigitalProductDocumentStatusChange.create({
              previousStatus: DigitalProductDocumentStatus.Draft,
              currentStatus: DigitalProductDocumentStatus.Published,
            });
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: orgId,
        environment: Environment.create({
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        }),
        lastStatusChange,
      });
      const config = PresentationConfiguration.createForPassport({
        organizationId: orgId,
        referenceId: passport.id,
      });
      const permalink = Permalink.create({
        presentationConfigurationId: config.id,
        slug: options.slug ?? null,
        primary: true,
        organizationId: orgId,
      });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
      await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
      return { passport, config, permalink };
    }

    it("(a) sets gs1DataAttributes on a gs1-link permalink → 200, reflected", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createGs1LinkPermalinkInOrg(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/${LatestApiVersionWithPrefixDto}/permalinks/${permalink.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({
          gs1DataAttributes: { "17": "251231" },
        });

      expect(response.status).toEqual(200);
      expect(response.body.gs1DataAttributes).toEqual({ "17": "251231" });
    });

    it("(b) rejects an invalid GS1 AI value with 400", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createGs1LinkPermalinkInOrg(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/${LatestApiVersionWithPrefixDto}/permalinks/${permalink.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ gs1DataAttributes: { "99zz": "bad-ai-key" } });

      expect(response.status).toEqual(400);
    });

    it("(c) slug/baseUrl update still works on a presentation permalink (regression)", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createPresentationPermalinkInOrg(org.id, { published: false });
      const slug = `slug-${randomUUID().slice(0, 8)}`;

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/${LatestApiVersionWithPrefixDto}/permalinks/${permalink.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ slug, baseUrl: "https://passports.example.com" });

      expect(response.status).toEqual(200);
      expect(response.body.slug).toEqual(slug);
      expect(response.body.baseUrl).toEqual("https://passports.example.com");
    });

    it("(d) returns 409 when patching slug on a PUBLISHED presentation permalink", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      // Seed a published permalink (publishedUrl frozen via direct DB write)
      const { permalink } = await createPresentationPermalinkInOrg(org.id, { published: true });
      // Freeze the publishedUrl so assertNotPublished fires
      const frozen = permalink.withPublishedUrl(`https://passports.example.com/${permalink.id}`);
      await ctx.getModuleRef().get(PermalinkRepository).save(frozen);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/${LatestApiVersionWithPrefixDto}/permalinks/${permalink.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ slug: `slug-${randomUUID().slice(0, 8)}` });

      expect(response.status).toEqual(409);
    });

    it("(e) returns 403 when the requester's org does not own the permalink", async () => {
      const { org: ownerOrg } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const outsider = await ctx.globals().betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createGs1LinkPermalinkInOrg(ownerOrg.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/${LatestApiVersionWithPrefixDto}/permalinks/${permalink.id}`)
        .set("Cookie", outsider.userCookie)
        .set(ORGANIZATION_ID_HEADER, outsider.org.id)
        .send({ gs1DataAttributes: { "17": "251231" } });

      expect(response.status).toEqual(403);
    });
  });

  // ---------------------------------------------------------------------------
  // Slice 48 — DELETE /permalinks/:id (guarded)
  // ---------------------------------------------------------------------------
  describe("DELETE /permalinks", () => {
    async function createTwoPresentationPermalinksInOrg(orgId: string) {
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: orgId,
        environment: Environment.create({
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        }),
      });
      const config1 = PresentationConfiguration.createForPassport({
        organizationId: orgId,
        referenceId: passport.id,
      });
      const config2 = PresentationConfiguration.createForPassport({
        organizationId: orgId,
        referenceId: passport.id,
      });
      const primaryPermalink = Permalink.create({
        presentationConfigurationId: config1.id,
        primary: true,
        organizationId: orgId,
      });
      const nonPrimaryPermalink = Permalink.create({
        presentationConfigurationId: config2.id,
        primary: false,
        organizationId: orgId,
      });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config1);
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config2);
      await ctx.getModuleRef().get(PermalinkRepository).save(primaryPermalink);
      await ctx.getModuleRef().get(PermalinkRepository).save(nonPrimaryPermalink);
      return { passport, primaryPermalink, nonPrimaryPermalink };
    }

    async function createSinglePresentationPermalinkInOrg(orgId: string) {
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: orgId,
        environment: Environment.create({
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        }),
      });
      const config = PresentationConfiguration.createForPassport({
        organizationId: orgId,
        referenceId: passport.id,
      });
      const permalink = Permalink.create({
        presentationConfigurationId: config.id,
        primary: true,
        organizationId: orgId,
      });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
      await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
      return { passport, permalink };
    }

    async function createGs1LinkPermalinkInOrgForDelete(orgId: string) {
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: orgId,
        environment: Environment.create({
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        }),
      });
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: passport.id,
        gtin: "04006381333931",
        batch: `LOT-${randomUUID().slice(0, 8)}`,
        serial: `SN-${randomUUID().slice(0, 8)}`,
        organizationId: orgId,
      });
      const gs1Permalink = Permalink.create({
        kind: PermalinkKind.GS1_LINK,
        uniqueProductIdentifierId: upi.uuid,
        presentationConfigurationId: null,
        gs1DataAttributes: null,
        primary: false,
        organizationId: orgId,
      });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      await ctx.getModuleRef().get(UniqueProductIdentifierRepository).save(upi);
      await ctx.getModuleRef().get(PermalinkRepository).save(gs1Permalink);
      return { passport, upi, permalink: gs1Permalink };
    }

    it("(a) DELETE an unpublished, non-primary presentation permalink (passport has >1) → 204", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { nonPrimaryPermalink } = await createTwoPresentationPermalinksInOrg(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .delete(`/${LatestApiVersionWithPrefixDto}/permalinks/${nonPrimaryPermalink.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(204);

      // Verify it was actually deleted
      const found = await ctx
        .getModuleRef()
        .get(PermalinkRepository)
        .findOne(nonPrimaryPermalink.id);
      expect(found).toBeUndefined();
    });

    it("(b) DELETE the last/primary presentation permalink → 409", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createSinglePresentationPermalinkInOrg(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .delete(`/${LatestApiVersionWithPrefixDto}/permalinks/${permalink.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(409);
    });

    it("(c) DELETE a published permalink → 409", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { nonPrimaryPermalink } = await createTwoPresentationPermalinksInOrg(org.id);
      // Freeze the permalink to simulate a published state
      const frozen = nonPrimaryPermalink.withPublishedUrl(
        `https://passports.example.com/${nonPrimaryPermalink.id}`,
      );
      await ctx.getModuleRef().get(PermalinkRepository).save(frozen);

      const response = await request(ctx.globals().app.getHttpServer())
        .delete(`/${LatestApiVersionWithPrefixDto}/permalinks/${frozen.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(409);
    });

    it("(d) DELETE an unpublished gs1-link permalink → 204", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createGs1LinkPermalinkInOrgForDelete(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .delete(`/${LatestApiVersionWithPrefixDto}/permalinks/${permalink.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(204);

      // Verify it was actually deleted
      const found = await ctx.getModuleRef().get(PermalinkRepository).findOne(permalink.id);
      expect(found).toBeUndefined();
    });

    it("(e) DELETE from a different org → 403", async () => {
      const { org: ownerOrg } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const outsider = await ctx.globals().betterAuthHelper.createOrganizationAndUserWithCookie();
      const { nonPrimaryPermalink } = await createTwoPresentationPermalinksInOrg(ownerOrg.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .delete(`/${LatestApiVersionWithPrefixDto}/permalinks/${nonPrimaryPermalink.id}`)
        .set("Cookie", outsider.userCookie)
        .set(ORGANIZATION_ID_HEADER, outsider.org.id);

      expect(response.status).toEqual(403);
    });

    it("(f) DELETE unknown id → 404", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(ctx.globals().app.getHttpServer())
        .delete(`/${LatestApiVersionWithPrefixDto}/permalinks/${randomUUID()}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(404);
    });
  });

  // ---------------------------------------------------------------------------
  // Slice 49 — POST /permalinks/:id/primary (set primary)
  // ---------------------------------------------------------------------------
  describe("POST /permalinks/:id/primary", () => {
    async function createTwoPresentationPermalinksForPrimary(orgId: string) {
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: orgId,
        environment: Environment.create({
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        }),
      });
      const config1 = PresentationConfiguration.createForPassport({
        organizationId: orgId,
        referenceId: passport.id,
      });
      const config2 = PresentationConfiguration.createForPassport({
        organizationId: orgId,
        referenceId: passport.id,
      });
      const primaryPermalink = Permalink.create({
        presentationConfigurationId: config1.id,
        primary: true,
        organizationId: orgId,
      });
      const nonPrimaryPermalink = Permalink.create({
        presentationConfigurationId: config2.id,
        primary: false,
        organizationId: orgId,
      });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config1);
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config2);
      await ctx.getModuleRef().get(PermalinkRepository).save(primaryPermalink);
      await ctx.getModuleRef().get(PermalinkRepository).save(nonPrimaryPermalink);
      return { passport, primaryPermalink, nonPrimaryPermalink };
    }

    async function createGs1LinkPermalinkForPrimary(orgId: string) {
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: orgId,
        environment: Environment.create({
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        }),
      });
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: passport.id,
        gtin: "04006381333931",
        batch: `LOT-${randomUUID().slice(0, 8)}`,
        serial: `SN-${randomUUID().slice(0, 8)}`,
        organizationId: orgId,
      });
      const gs1Permalink = Permalink.create({
        kind: PermalinkKind.GS1_LINK,
        uniqueProductIdentifierId: upi.uuid,
        presentationConfigurationId: null,
        gs1DataAttributes: null,
        primary: false,
        organizationId: orgId,
      });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      await ctx.getModuleRef().get(UniqueProductIdentifierRepository).save(upi);
      await ctx.getModuleRef().get(PermalinkRepository).save(gs1Permalink);
      return { passport, upi, permalink: gs1Permalink };
    }

    it("(a) POST on a presentation permalink → 200, primary:true, sibling flips to primary:false", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { nonPrimaryPermalink, primaryPermalink } =
        await createTwoPresentationPermalinksForPrimary(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .post(`/${LatestApiVersionWithPrefixDto}/permalinks/${nonPrimaryPermalink.id}/primary`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(200);
      expect(response.body.id).toEqual(nonPrimaryPermalink.id);
      expect(response.body.primary).toBe(true);

      // Verify the previously-primary sibling flipped to primary:false via a follow-up GET
      const listResponse = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(listResponse.status).toEqual(200);
      const newPrimary = listResponse.body.result.find(
        (r: { id: string }) => r.id === nonPrimaryPermalink.id,
      );
      const oldPrimary = listResponse.body.result.find(
        (r: { id: string }) => r.id === primaryPermalink.id,
      );
      expect(newPrimary?.primary).toBe(true);
      expect(oldPrimary?.primary).toBe(false);
    });

    it("(b) setting a gs1-link permalink as primary → 409", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createGs1LinkPermalinkForPrimary(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .post(`/${LatestApiVersionWithPrefixDto}/permalinks/${permalink.id}/primary`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(409);
    });

    it("(c) cross-org request → 403", async () => {
      const { org: ownerOrg } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const outsider = await ctx.globals().betterAuthHelper.createOrganizationAndUserWithCookie();
      const { nonPrimaryPermalink } = await createTwoPresentationPermalinksForPrimary(ownerOrg.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .post(`/${LatestApiVersionWithPrefixDto}/permalinks/${nonPrimaryPermalink.id}/primary`)
        .set("Cookie", outsider.userCookie)
        .set(ORGANIZATION_ID_HEADER, outsider.org.id);

      expect(response.status).toEqual(403);
    });

    it("(d) unknown id → 404", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(ctx.globals().app.getHttpServer())
        .post(`/${LatestApiVersionWithPrefixDto}/permalinks/${randomUUID()}/primary`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(404);
    });
  });
});
