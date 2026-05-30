import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
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
import { PermalinkModule } from "../../permalink/permalink.module";
import { UniqueProductIdentifier } from "../domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierModule } from "../unique.product.identifier.module";

describe("Gs1ResolverController", () => {
  // The resolver controller route is the absolute `/01/:gtin`; basePath is unused.
  const ctx = createAasTestContext(
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
  }) {
    const { aas, submodels } = ctx.getAasObjects();
    const environment = Environment.create({
      assetAdministrationShells: [aas.id],
      submodels: submodels.map((s) => s.id),
      conceptDescriptions: [],
    });
    const organizationId = randomUUID();
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
    const config = PresentationConfiguration.createForPassport({
      organizationId,
      referenceId: passport.id,
    });
    const permalink = Permalink.create({ presentationConfigurationId: config.id });
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: passport.id,
      gtin: options.gtin,
      batch: options.batch,
      serial: options.serial,
    });

    const moduleRef = ctx.getModuleRef();
    await moduleRef.get(PassportRepository).save(passport);
    await moduleRef.get(PresentationConfigurationRepository).save(config);
    await moduleRef.get(PermalinkRepository).save(permalink);
    await moduleRef.get(UniqueProductIdentifierRepository).save(upi);
    return { passport, permalink, gtin: upi.gs1!.gtin };
  }

  it("302-redirects a scanned GTIN to the passport's permalink public URL", async () => {
    const { permalink } = await seedGs1Passport({ gtin: "4006381333931" });
    const response = await request(ctx.globals().app.getHttpServer()).get("/01/04006381333931");
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(permalink.id);
  });

  it("normalizes a GTIN-13 in the path before resolving", async () => {
    await seedGs1Passport({ gtin: "00012345678905" });
    // request with the bare GTIN-14 form
    const response = await request(ctx.globals().app.getHttpServer()).get("/01/00012345678905");
    expect(response.status).toBe(302);
  });

  it("returns 404 for an unknown GTIN", async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get("/01/00000040170725");
    expect(response.status).toBe(404);
  });

  it("returns 404 for a malformed GTIN (bad check digit)", async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get("/01/4006381333930");
    expect(response.status).toBe(404);
  });

  it("keeps an unpublished passport gated (404) for anonymous scans", async () => {
    await seedGs1Passport({ gtin: "00111111111117", published: false });
    const response = await request(ctx.globals().app.getHttpServer()).get("/01/00111111111117");
    expect(response.status).toBe(404);
  });

  it("302-redirects a serial route /01/{gtin}/21/{serial}", async () => {
    const { permalink } = await seedGs1Passport({ gtin: "88000000000107", serial: "SN-001" });
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/01/88000000000107/21/SN-001",
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(permalink.id);
  });

  it("302-redirects a batch route /01/{gtin}/10/{batch}", async () => {
    const { permalink } = await seedGs1Passport({ gtin: "88000000000206", batch: "LOT-42" });
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/01/88000000000206/10/LOT-42",
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(permalink.id);
  });

  it("302-redirects the combined route /01/{gtin}/10/{batch}/21/{serial}", async () => {
    const { permalink } = await seedGs1Passport({
      gtin: "88000000000305",
      batch: "LOT-42",
      serial: "SN-001",
    });
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/01/88000000000305/10/LOT-42/21/SN-001",
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(permalink.id);
  });

  it("resolves serialized units of the same GTIN to their distinct passports", async () => {
    const gtin = "88000000000404";
    const a = await seedGs1Passport({ gtin, serial: "SN-A" });
    const b = await seedGs1Passport({ gtin, serial: "SN-B" });
    expect(a.permalink.id).not.toBe(b.permalink.id);

    const respA = await request(ctx.globals().app.getHttpServer()).get(`/01/${gtin}/21/SN-A`);
    expect(respA.status).toBe(302);
    expect(respA.headers.location).toContain(a.permalink.id);

    const respB = await request(ctx.globals().app.getHttpServer()).get(`/01/${gtin}/21/SN-B`);
    expect(respB.status).toBe(302);
    expect(respB.headers.location).toContain(b.permalink.id);
  });

  it("returns 404 for a bare-GTIN scan when only a serialized unit exists", async () => {
    const gtin = "88000000000503";
    await seedGs1Passport({ gtin, serial: "SN-ONLY" });
    // No bare-GTIN row exists, so the bare scan must not shadow the serialized one.
    const response = await request(ctx.globals().app.getHttpServer()).get(`/01/${gtin}`);
    expect(response.status).toBe(404);
  });

  it("returns 404 for an unknown serial on an existing GTIN", async () => {
    const gtin = "88000000000602";
    await seedGs1Passport({ gtin, serial: "SN-REAL" });
    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/01/${gtin}/21/SN-MISSING`,
    );
    expect(response.status).toBe(404);
  });

  it("returns 404 for a serial outside CSET-82", async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/01/88000000000701/21/bad%20value",
    );
    expect(response.status).toBe(404);
  });

  it("resolves a serial whose value contains a percent-encoded reserved character", async () => {
    const { permalink } = await seedGs1Passport({ gtin: "88000000000800", serial: "A/B" });
    const response = await request(ctx.globals().app.getHttpServer()).get(
      "/01/88000000000800/21/A%2FB",
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(permalink.id);
  });
});
