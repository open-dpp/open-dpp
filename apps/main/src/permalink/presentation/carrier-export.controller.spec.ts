import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { LatestApiVersionWithPrefixDto, PermalinkKind } from "@open-dpp/dto";
import sharp from "sharp";
import request from "supertest";
import { darkModuleRuns, decodeDataCarrier } from "../../../test/decode-data-carrier";
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
import { InstanceSettingsModule } from "../../instance-settings/instance-settings.module";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../passports/infrastructure/passport.schema";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { PresentationConfigurationsModule } from "../../presentation-configurations/presentation-configurations.module";
import { UniqueProductIdentifier } from "../../unique-product-identifier/domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierModule } from "../../unique-product-identifier/unique.product.identifier.module";
import { PermalinkApplicationService } from "../application/services/permalink.application.service";
import { QUIET_ZONE_MODULES } from "../domain/data-carrier";
import { Permalink } from "../domain/permalink";
import { PermalinkRepository } from "../infrastructure/permalink.repository";
import { PermalinkDoc, PermalinkSchema } from "../infrastructure/permalink.schema";
import { PermalinkModule } from "../permalink.module";

type Caller = { cookie: string; organizationId?: string } | { apiKey: string };

function binaryParser(res: any, callback: (error: Error | null, body: Buffer) => void) {
  const chunks: Buffer[] = [];
  res.on("data", (chunk: Buffer) => chunks.push(chunk));
  res.on("end", () => callback(null, Buffer.concat(chunks)));
}

describe("CarrierExportController", () => {
  const ctx = createAasTestContext(
    "/v1/p",
    "/v2/p",
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

  const server = () => ctx.globals().app.getHttpServer();
  const auth = () => ctx.globals().betterAuthHelper;

  async function seedPassport(
    organizationId: string,
    status: string = DigitalProductDocumentStatus.Published,
  ): Promise<Passport> {
    const lastStatusChange =
      status === DigitalProductDocumentStatus.Draft
        ? DigitalProductDocumentStatusChange.create({})
        : DigitalProductDocumentStatusChange.create({
            previousStatus: DigitalProductDocumentStatus.Draft,
            currentStatus: status as typeof DigitalProductDocumentStatus.Published,
          });
    const passport = Passport.create({
      id: randomUUID(),
      organizationId,
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      }),
      lastStatusChange,
    });
    await ctx.getModuleRef().get(PassportRepository).save(passport);
    return passport;
  }

  async function seedOpenDppPermalink(passport: Passport): Promise<Permalink> {
    const permalink = Permalink.create({
      passportId: passport.id,
      organizationId: passport.organizationId,
    });
    return await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
  }

  async function seedGs1Permalink(passport: Passport): Promise<Permalink> {
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: passport.id,
      organizationId: passport.organizationId,
      gtin: "09501101020917",
      batch: "AB-123",
      serial: `SER-${randomUUID().slice(0, 8)}`,
    });
    await ctx.getModuleRef().get(UniqueProductIdentifierRepository).save(upi);
    const permalink = Permalink.create({
      kind: PermalinkKind.GS1_LINK,
      passportId: passport.id,
      uniqueProductIdentifierId: upi.uuid,
      organizationId: passport.organizationId,
    });
    return await ctx.getModuleRef().get(PermalinkRepository).save(permalink);
  }

  /** The public URL the existing back-office read path renders for this permalink. */
  async function publicUrlOf(permalink: Permalink, cookie: string): Promise<string> {
    const response = await request(server())
      .get(`/${LatestApiVersionWithPrefixDto}/p?passportId=${permalink.passportId}`)
      .set("Cookie", cookie);
    expect(response.status).toEqual(200);
    const entry = response.body.find((p: { id: string }) => p.id === permalink.id);
    expect(entry).toBeDefined();
    return entry.publicUrl;
  }

  function getCarrier(permalinkId: string, caller: Caller | null, query: object = {}) {
    let call = request(server())
      .get(`/${LatestApiVersionWithPrefixDto}/permalinks/${permalinkId}/carrier`)
      .query(query)
      .buffer(true)
      .parse(binaryParser);
    if (caller && "apiKey" in caller) {
      call = call.set("x-api-key", caller.apiKey);
    } else if (caller) {
      call = call.set("Cookie", caller.cookie);
      if (caller.organizationId) {
        call = call.set(ORGANIZATION_ID_HEADER, caller.organizationId);
      }
    }
    return call;
  }

  async function memberWithPermalink(
    seed: (passport: Passport) => Promise<Permalink> = seedOpenDppPermalink,
    status?: string,
  ) {
    const { org, userCookie } = await auth().createOrganizationAndUserWithCookie();
    const passport = await seedPassport(org.id, status);
    const permalink = await seed(passport);
    return { org, userCookie, passport, permalink };
  }

  it("returns an SVG of the permalink's public URL at the default settings", async () => {
    const { org, userCookie, permalink } = await memberWithPermalink();
    const publicUrl = await publicUrlOf(permalink, userCookie);

    const response = await getCarrier(permalink.id, {
      cookie: userCookie,
      organizationId: org.id,
    });

    expect(response.status).toEqual(200);
    expect(response.headers["content-type"]).toMatch(/^image\/svg\+xml/);
    expect(response.headers["content-disposition"]).toEqual(
      `attachment; filename="data-carrier-${permalink.id}.svg"`,
    );
    const svg = response.body.toString("utf8");
    const modules = Number(/viewBox="0 0 (\d+) \1"/.exec(svg)?.[1]);
    expect(svg).toContain(`width="${Number((modules * 0.495).toFixed(3))}mm"`);
    await expect(decodeDataCarrier(response.body)).resolves.toEqual(publicUrl);
  });

  it("keeps a quiet zone of four modules around the symbol", async () => {
    const { org, userCookie, permalink } = await memberWithPermalink();

    const response = await getCarrier(permalink.id, {
      cookie: userCookie,
      organizationId: org.id,
    });

    const runs = darkModuleRuns(response.body.toString("utf8"));
    expect(Math.min(...runs.map((run) => run.column))).toEqual(QUIET_ZONE_MODULES);
    expect(Math.min(...runs.map((run) => run.row))).toEqual(QUIET_ZONE_MODULES);
  });

  it("returns a PNG with whole-pixel modules and the chosen DPI", async () => {
    const { org, userCookie, permalink } = await memberWithPermalink();
    const publicUrl = await publicUrlOf(permalink, userCookie);

    const response = await getCarrier(
      permalink.id,
      { cookie: userCookie, organizationId: org.id },
      { format: "png", moduleSize: "0.99", dpi: "600", errorCorrection: "Q" },
    );

    expect(response.status).toEqual(200);
    expect(response.headers["content-type"]).toMatch(/^image\/png/);
    expect(response.headers["content-disposition"]).toEqual(
      `attachment; filename="data-carrier-${permalink.id}.png"`,
    );
    const metadata = await sharp(response.body).metadata();
    expect(metadata.density).toEqual(600);
    // 0.99 mm at 600 DPI is 23 whole pixels per module
    expect(metadata.width! % 23).toEqual(0);
    await expect(decodeDataCarrier(response.body)).resolves.toEqual(publicUrl);
  });

  it("encodes a GS1 Digital Link exactly as the read paths render it", async () => {
    const { org, userCookie, permalink } = await memberWithPermalink(seedGs1Permalink);
    const publicUrl = await publicUrlOf(permalink, userCookie);

    const response = await getCarrier(permalink.id, {
      cookie: userCookie,
      organizationId: org.id,
    });

    expect(response.status).toEqual(200);
    expect(publicUrl).toContain("/01/09501101020917/10/AB-123/21/SER-");
    await expect(decodeDataCarrier(response.body)).resolves.toEqual(publicUrl);
  });

  it.each([DigitalProductDocumentStatus.Draft, DigitalProductDocumentStatus.Archived])(
    "exports the permalink of a %s passport",
    async (status) => {
      const { org, userCookie, permalink } = await memberWithPermalink(
        seedOpenDppPermalink,
        status,
      );
      const publicUrl = await publicUrlOf(permalink, userCookie);

      const response = await getCarrier(permalink.id, {
        cookie: userCookie,
        organizationId: org.id,
      });

      expect(response.status).toEqual(200);
      await expect(decodeDataCarrier(response.body)).resolves.toEqual(publicUrl);
    },
  );

  it("derives access from the passport's organization, without an organization header", async () => {
    const { userCookie, permalink } = await memberWithPermalink();

    const response = await getCarrier(permalink.id, { cookie: userCookie });

    expect(response.status).toEqual(200);
  });

  it("accepts the API key of a member", async () => {
    const { org, apiKey } = await auth().createOrganizationAndUserWithApiKey();
    const permalink = await seedOpenDppPermalink(await seedPassport(org.id));

    const response = await getCarrier(permalink.id, { apiKey });

    expect(response.status).toEqual(200);
    expect(response.headers["content-type"]).toMatch(/^image\/svg\+xml/);
  });

  it("returns 404 to a member of another organization", async () => {
    const { permalink } = await memberWithPermalink();
    const outsider = await auth().createOrganizationAndUserWithCookie();

    const response = await getCarrier(permalink.id, {
      cookie: outsider.userCookie,
      organizationId: outsider.org.id,
    });

    expect(response.status).toEqual(404);
  });

  it("returns 404 for an unknown permalink", async () => {
    const { org, userCookie } = await auth().createOrganizationAndUserWithCookie();

    const response = await getCarrier(randomUUID(), { cookie: userCookie, organizationId: org.id });

    expect(response.status).toEqual(404);
  });

  it("refuses anonymous callers", async () => {
    const { permalink } = await memberWithPermalink();

    const response = await getCarrier(permalink.id, null);

    expect(response.status).toEqual(403);
  });

  it.each([
    ["an unknown format", { format: "pdf" }],
    ["a module size out of bounds", { moduleSize: "10" }],
    ["an unknown error-correction level", { errorCorrection: "X" }],
  ])("returns 400 for %s", async (_label, query) => {
    const { org, userCookie, permalink } = await memberWithPermalink();

    const response = await getCarrier(
      permalink.id,
      { cookie: userCookie, organizationId: org.id },
      query,
    );

    expect(response.status).toEqual(400);
  });

  it("returns 400 for a PNG beyond the pixel limit", async () => {
    const { org, userCookie, permalink } = await memberWithPermalink();

    const response = await getCarrier(
      permalink.id,
      { cookie: userCookie, organizationId: org.id },
      { format: "png", moduleSize: "3.5", dpi: "1200" },
    );

    expect(response.status).toEqual(400);
  });
});
