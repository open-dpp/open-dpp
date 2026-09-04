import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { PermalinkKind } from "@open-dpp/dto";
import request from "supertest";
import { Environment } from "../../aas/domain/environment";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import {
  ConceptDescriptionDoc,
  ConceptDescriptionSchema,
} from "../../aas/infrastructure/schemas/concept-description.schema";
import { createAasTestContext } from "../../aas/presentation/aas.test.context";
import { Branding } from "../../branding/domain/branding";
import { BrandingRepository } from "../../branding/infrastructure/branding.repository";
import { BrandingDoc, BrandingSchema } from "../../branding/infrastructure/branding.schema";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
} from "../../digital-product-document/domain/digital-product-document-status";
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
import { InstanceSettingsModule } from "../../instance-settings/instance-settings.module";
import { Permalink } from "../../permalink/domain/permalink";
import { PermalinkRepository } from "../../permalink/infrastructure/permalink.repository";
import { PermalinkDoc, PermalinkSchema } from "../../permalink/infrastructure/permalink.schema";
import {
  PermalinkApplicationService,
  resolveGs1LinkPublicUrl,
} from "../../permalink/application/services/permalink.application.service";
import { PermalinkModule } from "../../permalink/permalink.module";
import { UniqueProductIdentifier } from "../domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierModule } from "../unique.product.identifier.module";

describe("Gs1ResolverController", () => {
  const ctx = createAasTestContext(
    "/01",
    "/01",
    {
      imports: [
        UniqueProductIdentifierModule,
        PermalinkModule,
        PresentationConfigurationsModule,
        InstanceSettingsModule,
      ],
      providers: [
        UniqueProductIdentifierRepository,
        PermalinkRepository,
        PassportRepository,
        BrandingRepository,
        PresentationConfigurationRepository,
      ],
    },
    [
      { name: PassportDoc.name, schema: PassportSchema },
      { name: BrandingDoc.name, schema: BrandingSchema },
      { name: PermalinkDoc.name, schema: PermalinkSchema },
      { name: UniqueProductIdentifierDoc.name, schema: UniqueProductIdentifierSchema },
      { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
    ],
    PassportRepository,
    SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.OWNER }),
  );

  async function seedGs1Passport(options: {
    gtin: string;
    batch?: string;
    serial?: string;
    published?: boolean;
    organizationId?: string;
  }) {
    const { aas, submodels } = ctx.getAasObjects();
    const environment = Environment.create({
      assetAdministrationShells: [aas.id],
      submodels: submodels.map((s) => s.id),
      conceptDescriptions: [],
    });
    const organizationId = options.organizationId ?? randomUUID();
    const lastStatusChange =
      options.published === false
        ? DigitalProductDocumentStatusChange.create({})
        : DigitalProductDocumentStatusChange.create({
            previousStatus: DigitalProductDocumentStatus.Draft,
            currentStatus: DigitalProductDocumentStatus.Published,
          });
    const passport = Passport.create({
      id: randomUUID(),
      organizationId,
      environment,
      lastStatusChange,
    });
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: passport.id,
      gtin: options.gtin,
      batch: options.batch,
      serial: options.serial,
    });
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      passportId: passport.id,
      uniqueProductIdentifierId: upi.uuid,
      presentationConfigurationId: null,
      organizationId,
    });

    const moduleRef = ctx.getModuleRef();
    await moduleRef.get(PassportRepository).save(passport);
    await moduleRef.get(PermalinkRepository).save(permalink);
    await moduleRef.get(UniqueProductIdentifierRepository).save(upi);
    return { passport, permalink, gtin: upi.gs1!.gtin };
  }

  it("returns 404 when the UPI has no gs1-link permalink (no fallback to other permalinks)", async () => {
    const organizationId = randomUUID();
    const passport = Passport.create({
      id: randomUUID(),
      organizationId,
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
      organizationId,
      referenceId: passport.id,
    });
    const presentation = Permalink.create({
      passportId: passport.id,
      presentationConfigurationId: config.id,
    });
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: passport.id,
      gtin: "88000000000909",
    });
    const moduleRef = ctx.getModuleRef();
    await moduleRef.get(PassportRepository).save(passport);
    await moduleRef.get(PresentationConfigurationRepository).save(config);
    await moduleRef.get(PermalinkRepository).save(presentation);
    await moduleRef.get(UniqueProductIdentifierRepository).save(upi);

    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/gs1/v1/01/88000000000909",
    );
    expect(response.status).toBe(404);
  });

  it("302-redirects a scanned GTIN to the passport's permalink public URL", async () => {
    const { permalink } = await seedGs1Passport({ gtin: "4006381333931" });
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/gs1/v1/01/04006381333931",
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(permalink.id);
  });

  it("forwards the request query string to the redirect target (GS1-conformant resolver §2.12)", async () => {
    const { gtin } = await seedGs1Passport({ gtin: "614141123452" });
    const server = ctx.globals().app.getHttpServer();
    const bare = await request(server).get(`/gs1/v1/01/${gtin}`);
    expect(bare.status).toBe(302);
    const withQuery = await request(server).get(`/gs1/v1/01/${gtin}?11=241220&17=270101`);
    expect(withQuery.status).toBe(302);
    expect(withQuery.headers.location).toBe(`${bare.headers.location}?11=241220&17=270101`);
  });

  it("normalizes a GTIN-13 in the path before resolving", async () => {
    await seedGs1Passport({ gtin: "00012345678905" });
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/gs1/v1/01/00012345678905",
    );
    expect(response.status).toBe(302);
  });

  it("returns 404 for an unknown GTIN", async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/gs1/v1/01/00000040170725",
    );
    expect(response.status).toBe(404);
  });

  it("returns 404 for a malformed GTIN (bad check digit)", async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/gs1/v1/01/4006381333930",
    );
    expect(response.status).toBe(404);
  });

  it("keeps an unpublished passport gated (404) for anonymous scans", async () => {
    await seedGs1Passport({ gtin: "00111111111117", published: false });
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/gs1/v1/01/00111111111117",
    );
    expect(response.status).toBe(404);
  });

  it("302-redirects an unpublished passport scan for a member of the passport's organization", async () => {
    const { org, userCookie } = await ctx.globals().getOrganizationAndUserWithCookie();
    const { permalink } = await seedGs1Passport({
      gtin: "88000000001005",
      published: false,
      organizationId: org!.id,
    });
    const response = await request(ctx.globals().app.getHttpServer())
      .get("/gs1/v1/01/88000000001005")
      .set("Cookie", userCookie);
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(permalink.id);
  });

  it("keeps an unpublished passport gated (404) for an authenticated member of another org", async () => {
    const outsider = await ctx.globals().betterAuthHelper.createOrganizationAndUserWithCookie();
    await seedGs1Passport({ gtin: "88000000001104", published: false });
    const response = await request(ctx.globals().app.getHttpServer())
      .get("/gs1/v1/01/88000000001104")
      .set("Cookie", outsider.userCookie);
    expect(response.status).toBe(404);
  });

  it("302-redirects a serial route /gs1/v1/01/{gtin}/21/{serial}", async () => {
    const { permalink } = await seedGs1Passport({ gtin: "88000000000107", serial: "SN-001" });
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/gs1/v1/01/88000000000107/21/SN-001",
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(permalink.id);
  });

  it("302-redirects a batch route /gs1/v1/01/{gtin}/10/{batch}", async () => {
    const { permalink } = await seedGs1Passport({ gtin: "88000000000206", batch: "LOT-42" });
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/gs1/v1/01/88000000000206/10/LOT-42",
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(permalink.id);
  });

  it("302-redirects the combined route /gs1/v1/01/{gtin}/10/{batch}/21/{serial}", async () => {
    const { permalink } = await seedGs1Passport({
      gtin: "88000000000305",
      batch: "LOT-42",
      serial: "SN-001",
    });
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/gs1/v1/01/88000000000305/10/LOT-42/21/SN-001",
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(permalink.id);
  });

  it("resolves serialized units of the same GTIN to their distinct passports", async () => {
    const gtin = "88000000000404";
    const a = await seedGs1Passport({ gtin, serial: "SN-A" });
    const b = await seedGs1Passport({ gtin, serial: "SN-B" });
    expect(a.permalink.id).not.toBe(b.permalink.id);

    const respA = await request(ctx.globals().app.getHttpServer()).get(
      `/gs1/v1/01/${gtin}/21/SN-A`,
    );
    expect(respA.status).toBe(302);
    expect(respA.headers.location).toContain(a.permalink.id);

    const respB = await request(ctx.globals().app.getHttpServer()).get(
      `/gs1/v1/01/${gtin}/21/SN-B`,
    );
    expect(respB.status).toBe(302);
    expect(respB.headers.location).toContain(b.permalink.id);
  });

  it("returns 404 for a bare-GTIN scan when only a serialized unit exists", async () => {
    const gtin = "88000000000503";
    await seedGs1Passport({ gtin, serial: "SN-ONLY" });
    const response = await request(ctx.globals().app.getHttpServer()).get(`/gs1/v1/01/${gtin}`);
    expect(response.status).toBe(404);
  });

  it("returns 404 for an unknown serial on an existing GTIN", async () => {
    const gtin = "88000000000602";
    await seedGs1Passport({ gtin, serial: "SN-REAL" });
    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/gs1/v1/01/${gtin}/21/SN-MISSING`,
    );
    expect(response.status).toBe(404);
  });

  it("returns 404 for a serial outside CSET-82", async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/gs1/v1/01/88000000000701/21/bad%20value",
    );
    expect(response.status).toBe(404);
  });

  it("resolves a serial whose value contains a percent-encoded reserved character", async () => {
    const { permalink } = await seedGs1Passport({ gtin: "88000000000800", serial: "A/B" });
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/gs1/v1/01/88000000000800/21/A%2FB",
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(permalink.id);
  });

  describe("scanned GS1 Digital Links resolve to the presentation view", () => {
    async function seedGs1LinkPermalink(options: {
      gtin: string;
      batch?: string;
      serial?: string;
      baseUrl?: string | null;
      brandingBaseUrl?: string | null;
      gs1DataAttributes?: Record<string, string> | null;
      organizationId?: string;
    }) {
      const { aas, submodels } = ctx.getAasObjects();
      const environment = Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map((s) => s.id),
        conceptDescriptions: [],
      });
      const organizationId = options.organizationId ?? randomUUID();
      const passport = Passport.create({
        id: randomUUID(),
        organizationId,
        environment,
        lastStatusChange: DigitalProductDocumentStatusChange.create({
          previousStatus: DigitalProductDocumentStatus.Draft,
          currentStatus: DigitalProductDocumentStatus.Published,
        }),
      });
      const config = PresentationConfiguration.createForPassport({
        organizationId,
        referenceId: passport.id,
      });
      const upi = UniqueProductIdentifier.createGs1({
        referenceId: passport.id,
        gtin: options.gtin,
        batch: options.batch,
        serial: options.serial,
      });
      const permalink = Permalink.create({
        kind: PermalinkKind.GS1_LINK,
        passportId: passport.id,
        uniqueProductIdentifierId: upi.uuid,
        presentationConfigurationId: config.id,
        gs1DataAttributes: options.gs1DataAttributes ?? null,
        baseUrl: options.baseUrl ?? null,
        organizationId,
      });
      const branding =
        options.brandingBaseUrl != null
          ? Branding.create({ organizationId, permalinkBaseUrl: options.brandingBaseUrl })
          : null;

      const moduleRef = ctx.getModuleRef();
      await moduleRef.get(PassportRepository).save(passport);
      await moduleRef.get(PresentationConfigurationRepository).save(config);
      await moduleRef.get(PermalinkRepository).save(permalink);
      await moduleRef.get(UniqueProductIdentifierRepository).save(upi);
      if (branding) {
        await moduleRef.get(BrandingRepository).save(branding);
      }
      return { passport, permalink, upi, branding, organizationId };
    }

    async function renderScannedUrl(seed: {
      permalink: Permalink;
      upi: UniqueProductIdentifier;
      branding: Branding | null;
    }): Promise<string> {
      const svc = ctx.getModuleRef().get(PermalinkApplicationService, { strict: false });
      const envUrl = await svc.getPermalinkBaseUrl();
      return resolveGs1LinkPublicUrl(seed.permalink, seed.upi.gs1!, seed.branding, envUrl);
    }

    async function instanceBase(): Promise<string> {
      const svc = ctx.getModuleRef().get(PermalinkApplicationService, { strict: false });
      return svc.getPermalinkBaseUrl();
    }

    async function expectScanRedirects(
      seed: Awaited<ReturnType<typeof seedGs1LinkPermalink>>,
      expectedLocation: string,
      hit?: { query?: string; host?: string },
    ) {
      const url = await renderScannedUrl(seed);
      const parsed = new URL(url);
      const target = parsed.pathname + (hit?.query ?? parsed.search);
      let req = request(ctx.globals().app.getHttpServer()).get(target);
      if (hit?.host) {
        req = req.set("Host", hit.host);
      }
      const res = await req;
      expect(res.status).toBe(302);
      expect(new URL(res.headers.location).pathname).not.toMatch(/^\/01\//);
      expect(res.headers.location).toBe(expectedLocation);
      return { url, res };
    }

    it("never 302s a scanned Digital Link back to itself (M1 regression)", async () => {
      const seed = await seedGs1LinkPermalink({ gtin: "04006381333931", serial: "SN-6" });
      const url = await renderScannedUrl(seed);
      const parsed = new URL(url);
      const res = await request(ctx.globals().app.getHttpServer()).get(
        parsed.pathname + parsed.search,
      );
      expect(res.status).toBe(302);
      const location = new URL(res.headers.location);
      expect(location.pathname).not.toMatch(/^\/01\//);
      expect(location.pathname + location.search).not.toBe(parsed.pathname + parsed.search);
    });

    it("redirects a QR rendered on a per-permalink base URL to the instance viewer", async () => {
      const seed = await seedGs1LinkPermalink({
        gtin: "04006381333931",
        serial: "SN-1",
        baseUrl: "https://id.example.com",
        gs1DataAttributes: { "17": "251231" },
      });
      await expectScanRedirects(seed, `${await instanceBase()}/${seed.permalink.id}?17=251231`);
    });

    it("redirects to the org branding base when branding is set", async () => {
      const seed = await seedGs1LinkPermalink({
        gtin: "04006381333931",
        serial: "SN-2",
        brandingBaseUrl: "https://brand.example.com",
        organizationId: ctx.globals().organizationId,
      });
      await expectScanRedirects(seed, `https://brand.example.com/${seed.permalink.id}`);
    });

    it("redirects to the instance-default base when no branding is set", async () => {
      const seed = await seedGs1LinkPermalink({ gtin: "04006381333931", serial: "SN-3" });
      await expectScanRedirects(seed, `${await instanceBase()}/${seed.permalink.id}`);
    });

    it("never reads the query for resolution, but forwards all pairs to the target", async () => {
      const seed = await seedGs1LinkPermalink({
        gtin: "04006381333931",
        serial: "SN-4",
        baseUrl: "https://id.example.com",
        gs1DataAttributes: { "17": "251231" },
      });
      const viewerUrl = `${await instanceBase()}/${seed.permalink.id}`;
      await expectScanRedirects(seed, viewerUrl, { query: "" });
      await expectScanRedirects(seed, `${viewerUrl}?17=990101&99=IGNORED`, {
        query: "?17=990101&99=IGNORED",
      });
    });

    it("resolves regardless of the inbound request Host (host-agnostic resolver)", async () => {
      const seed = await seedGs1LinkPermalink({
        gtin: "04006381333931",
        serial: "SN-5",
        baseUrl: "https://id.example.com",
      });
      await expectScanRedirects(seed, `${await instanceBase()}/${seed.permalink.id}`, {
        host: "scanner.anywhere.test",
      });
    });

    it("first anonymous scan pins the QR URL (publishedUrl) while redirecting to the viewer", async () => {
      const seed = await seedGs1LinkPermalink({
        gtin: "04006381333931",
        serial: "SN-7",
        brandingBaseUrl: "https://brand.example.com",
        organizationId: ctx.globals().organizationId,
      });
      const rendered = await renderScannedUrl(seed);
      const viewerUrl = `https://brand.example.com/${seed.permalink.id}`;
      await expectScanRedirects(seed, viewerUrl);
      const reloaded = await ctx
        .getModuleRef()
        .get(PermalinkRepository)
        .findOneOrFail(seed.permalink.id);
      expect(reloaded.publishedUrl).toBe(rendered);
      await expectScanRedirects(seed, viewerUrl);
    });
  });
});
