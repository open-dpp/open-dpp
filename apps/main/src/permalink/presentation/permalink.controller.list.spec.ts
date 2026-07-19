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
  // Slice 45 — GET /permalinks (org-scoped list, both kinds)
  // ---------------------------------------------------------------------------
  describe("GET /permalinks", () => {
    async function createOrgWithPermalink(
      orgId: string,
      options: { primary?: boolean; slug?: string | null } = {},
    ) {
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
      const permalink = Permalink.create({
        presentationConfigurationId: config.id,
        slug: options.slug ?? null,
        primary: options.primary ?? true,
        organizationId: orgId,
      });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
      await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
      return { passport, config, permalink };
    }

    it("(a) returns 200 array of all permalinks for the org including id, primary, publicUrl", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createOrgWithPermalink(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(200);
      expect(response.body.paging_metadata).toBeDefined();
      expect(Array.isArray(response.body.result)).toBe(true);
      const row = response.body.result.find((r: { id: string }) => r.id === permalink.id);
      expect(row).toBeDefined();
      expect(row.id).toEqual(permalink.id);
      expect(typeof row.primary).toBe("boolean");
      expect(typeof row.publicUrl).toBe("string");
    });

    it("(a-gs1) returns gs1-link permalink with uniqueProductIdentifierId and gs1 fields", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const upiId = randomUUID();
      const gs1Permalink = Permalink.create({
        kind: PermalinkKind.GS1_LINK,
        uniqueProductIdentifierId: upiId,
        presentationConfigurationId: null,
        gs1DataAttributes: null,
        primary: false,
        organizationId: org.id,
      });
      await ctx.getModuleRef().get(PermalinkRepository).save(gs1Permalink);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(200);
      const row = response.body.result.find((r: { id: string }) => r.id === gs1Permalink.id);
      expect(row).toBeDefined();
      expect(row.kind).toEqual(PermalinkKind.GS1_LINK);
      expect(row.uniqueProductIdentifierId).toEqual(upiId);
      expect(row.primary).toBe(false);
    });

    it("(b) excludes permalinks belonging to a different org", async () => {
      const { org: orgA, userCookie: cookieA } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { org: orgB } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      await createOrgWithPermalink(orgA.id);
      await createOrgWithPermalink(orgB.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", cookieA)
        .set(ORGANIZATION_ID_HEADER, orgA.id);

      expect(response.status).toEqual(200);
      // All returned rows must belong to orgA
      for (const row of response.body.result as { id: string }[]) {
        const stored = await ctx.getModuleRef().get(PermalinkRepository).findOneOrFail(row.id);
        expect(stored.organizationId).toEqual(orgA.id);
      }
    });

    it("(e) paginates via ?limit and ?cursor — the second page does not overlap the first", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const repo = ctx.getModuleRef().get(PermalinkRepository);
      for (let i = 0; i < 3; i++) {
        await repo.save(
          Permalink.create({
            kind: PermalinkKind.GS1_LINK,
            uniqueProductIdentifierId: randomUUID(),
            presentationConfigurationId: null,
            gs1DataAttributes: null,
            primary: false,
            organizationId: org.id,
          }),
        );
      }

      const page1 = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .query({ limit: 2 })
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(page1.status).toEqual(200);
      expect(page1.body.result).toHaveLength(2);
      expect(page1.body.paging_metadata.cursor).toBeTruthy();

      const page2 = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .query({ limit: 2, cursor: page1.body.paging_metadata.cursor })
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(page2.status).toEqual(200);
      expect(page2.body.result).toHaveLength(1);

      const page1Ids = page1.body.result.map((r: { id: string }) => r.id);
      const page2Ids = page2.body.result.map((r: { id: string }) => r.id);
      expect(page1Ids.some((id: string) => page2Ids.includes(id))).toBe(false);
    });

    it("(c) returns 400 when the org header is missing", async () => {
      const { userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", userCookie);

      expect(response.status).toEqual(400);
    });

    it("(d) returns 403 when the requester is not a member of the org", async () => {
      const { org } = await ctx.globals().betterAuthHelper.createOrganizationAndUserWithCookie();
      const nonMember = await ctx.globals().betterAuthHelper.createUser();
      const nonMemberCookie = await ctx.globals().betterAuthHelper.signAsUser(nonMember.user.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/permalinks`)
        .set("Cookie", nonMemberCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(403);
    });
  });

  // ---------------------------------------------------------------------------
  // Passport-scoped list — GET /passports/:id/permalinks (presentation + gs1-link union)
  // ---------------------------------------------------------------------------
  describe("GET /passports/:id/permalinks", () => {
    async function seedPassportWithPermalinks(orgId: string) {
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
      const presentation = Permalink.create({
        presentationConfigurationId: config.id,
        primary: true,
        organizationId: orgId,
      });
      // gs1-link permalink whose UPI belongs to this passport (the union's gs1 side)
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: passport.id,
        gtin: "04006381333931",
        serial: `SN-${randomUUID().slice(0, 8)}`,
        organizationId: orgId,
      });
      const gs1Link = Permalink.create({
        kind: PermalinkKind.GS1_LINK,
        uniqueProductIdentifierId: upi.uuid,
        presentationConfigurationId: null,
        gs1DataAttributes: null,
        primary: false,
        organizationId: orgId,
      });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
      await ctx.getModuleRef().get(UniqueProductIdentifierRepository).save(upi);
      await ctx.getModuleRef().get(PermalinkRepository).save(presentation);
      await ctx.getModuleRef().get(PermalinkRepository).save(gs1Link);
      return { passport, presentation, gs1Link };
    }

    it("returns 200 with the passport's permalinks (presentation + gs1-link union), envelope shape", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { passport, presentation, gs1Link } = await seedPassportWithPermalinks(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/passports/${passport.id}/permalinks`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(200);
      expect(response.body.paging_metadata).toBeDefined();
      expect(Array.isArray(response.body.result)).toBe(true);
      const ids = response.body.result.map((r: { id: string }) => r.id);
      expect(ids).toContain(presentation.id);
      expect(ids).toContain(gs1Link.id);
      const presRow = response.body.result.find((r: { id: string }) => r.id === presentation.id);
      expect(typeof presRow.publicUrl).toBe("string");
    });

    it("scopes to the passport — excludes another passport's permalinks", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const first = await seedPassportWithPermalinks(org.id);
      const other = await seedPassportWithPermalinks(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/passports/${first.passport.id}/permalinks`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(200);
      const ids = response.body.result.map((r: { id: string }) => r.id);
      expect(ids).toContain(first.presentation.id);
      expect(ids).not.toContain(other.presentation.id);
      expect(ids).not.toContain(other.gs1Link.id);
    });

    it("paginates via ?limit and ?cursor — the second page does not overlap the first", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { passport } = await seedPassportWithPermalinks(org.id); // 2 permalinks total

      const page1 = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/passports/${passport.id}/permalinks`)
        .query({ limit: 1 })
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);
      expect(page1.status).toEqual(200);
      expect(page1.body.result).toHaveLength(1);
      expect(page1.body.paging_metadata.cursor).toBeTruthy();

      const page2 = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/passports/${passport.id}/permalinks`)
        .query({ limit: 1, cursor: page1.body.paging_metadata.cursor })
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);
      expect(page2.status).toEqual(200);
      expect(page2.body.result).toHaveLength(1);
      expect(page1.body.result[0].id).not.toEqual(page2.body.result[0].id);
    });

    it("returns 403 for a cross-org / non-member request", async () => {
      const { org: ownerOrg } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const outsider = await ctx.globals().betterAuthHelper.createOrganizationAndUserWithCookie();
      const { passport } = await seedPassportWithPermalinks(ownerOrg.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/passports/${passport.id}/permalinks`)
        .set("Cookie", outsider.userCookie)
        .set(ORGANIZATION_ID_HEADER, outsider.org.id);

      expect(response.status).toEqual(403);
    });

    it("returns 404 when the passport does not exist", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/passports/${randomUUID()}/permalinks`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(404);
    });

    it("returns 400 when the org header is missing", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { passport } = await seedPassportWithPermalinks(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/${LatestApiVersionWithPrefixDto}/passports/${passport.id}/permalinks`)
        .set("Cookie", userCookie);

      expect(response.status).toEqual(400);
    });
  });
});
