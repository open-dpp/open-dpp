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
import { Branding } from "../../branding/domain/branding";
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
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { PresentationConfigurationsModule } from "../../presentation-configurations/presentation-configurations.module";
import { InstanceSettingsModule } from "../../instance-settings/instance-settings.module";
import { PermalinkDoc, PermalinkSchema } from "../../permalink/infrastructure/permalink.schema";
import { PermalinkModule } from "../../permalink/permalink.module";
import { UniqueProductIdentifier } from "../domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../infrastructure/unique-product-identifier.schema";
import { ExternalIdentifierType } from "./dto/unique-product-identifier-dto.schema";
import { UniqueProductIdentifierModule } from "../unique.product.identifier.module";

describe("Gs1IdentityController", () => {
  const basePath = "/passports";
  const VALID_GTIN13 = "4006381333931";
  const VALID_GTIN13_AS_14 = "04006381333931";

  const ctx = createAasTestContext(
    basePath,
    {
      imports: [
        UniqueProductIdentifierModule,
        PermalinkModule,
        PresentationConfigurationsModule,
        InstanceSettingsModule,
      ],
      providers: [UniqueProductIdentifierRepository, PassportRepository, BrandingRepository],
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

  async function createPassport(orgId: string, options: { published?: boolean } = {}) {
    const { aas, submodels } = ctx.getAasObjects();
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: orgId,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map((s) => s.id),
        conceptDescriptions: [],
      }),
      lastStatusChange: options.published
        ? DigitalProductDocumentStatusChange.create({
            previousStatus: DigitalProductDocumentStatus.Draft,
            currentStatus: DigitalProductDocumentStatus.Published,
          })
        : DigitalProductDocumentStatusChange.create({}),
    });
    const moduleRef = ctx.getModuleRef();
    await moduleRef
      .get(UniqueProductIdentifierRepository)
      .save(passport.createUniqueProductIdentifier());
    await moduleRef.get(PassportRepository).save(passport);
    return passport;
  }

  it("PUT assigns a GTIN to a draft passport and returns its Digital Link", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id);

    const response = await request(app.getHttpServer())
      .put(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send({ gtin: VALID_GTIN13 });

    expect(response.status).toEqual(200);
    expect(response.body.gtin).toEqual(VALID_GTIN13_AS_14);
    expect(response.body.referenceId).toEqual(passport.id);
    expect(response.body.digitalLink).toMatch(new RegExp(`/01/${VALID_GTIN13_AS_14}$`));

    const gs1 = await ctx
      .getModuleRef()
      .get(UniqueProductIdentifierRepository)
      .findByReferenceIdAndType(passport.id, ExternalIdentifierType.GS1);
    expect(gs1?.gs1).toEqual({ gtin: VALID_GTIN13_AS_14 });
  });

  it("PUT rejects an invalid GTIN (bad check digit) with 400", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id);

    const response = await request(app.getHttpServer())
      .put(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send({ gtin: "4006381333930" });

    expect(response.status).toEqual(400);
  });

  it("GET returns the assigned GS1 identity", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id);
    await ctx
      .getModuleRef()
      .get(UniqueProductIdentifierRepository)
      .save(
        UniqueProductIdentifier.createGs1({ referenceId: passport.id, gtin: "00012345678905" }),
      );

    const response = await request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();

    expect(response.status).toEqual(200);
    expect(response.body.gtin).toEqual("00012345678905");
  });

  it("GET returns 404 when the passport has no GS1 identity", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id);

    const response = await request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();

    expect(response.status).toEqual(404);
  });

  it("PUT rejects a GTIN already used by another passport with 409", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const sharedGtin = "00111111111117";
    const other = await createPassport(org!.id);
    await ctx
      .getModuleRef()
      .get(UniqueProductIdentifierRepository)
      .save(UniqueProductIdentifier.createGs1({ referenceId: other.id, gtin: sharedGtin }));
    const passport = await createPassport(org!.id);

    const response = await request(app.getHttpServer())
      .put(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send({ gtin: sharedGtin });

    expect(response.status).toEqual(409);
  });

  it("PUT rejects assigning a GTIN to a published passport with 409", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id, { published: true });

    const response = await request(app.getHttpServer())
      .put(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send({ gtin: "00222222222224" });

    expect(response.status).toEqual(409);
  });

  it("PUT edits an existing GS1 identity on a draft passport", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id);
    await ctx
      .getModuleRef()
      .get(UniqueProductIdentifierRepository)
      .save(
        UniqueProductIdentifier.createGs1({ referenceId: passport.id, gtin: "00990000000103" }),
      );

    const response = await request(app.getHttpServer())
      .put(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send({ gtin: "00990000000103", serial: "SN-NEW" });

    expect(response.status).toEqual(200);
    expect(response.body.serial).toEqual("SN-NEW");
  });

  it("DELETE removes a GS1 identity from a draft passport and keeps the canonical UUID", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id);
    await ctx
      .getModuleRef()
      .get(UniqueProductIdentifierRepository)
      .save(
        UniqueProductIdentifier.createGs1({ referenceId: passport.id, gtin: "00990000000110" }),
      );

    const response = await request(app.getHttpServer())
      .delete(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();

    expect(response.status).toEqual(204);

    const repo = ctx.getModuleRef().get(UniqueProductIdentifierRepository);
    expect(
      await repo.findByReferenceIdAndType(passport.id, ExternalIdentifierType.GS1),
    ).toBeUndefined();
    // The canonical OPEN_DPP_UUID UPI must survive the GS1 removal.
    const canonical = await repo.findByReferenceIdAndType(
      passport.id,
      ExternalIdentifierType.OPEN_DPP_UUID,
    );
    expect(canonical).toBeDefined();
  });

  it("DELETE returns 404 when the draft passport has no GS1 identity", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id);

    const response = await request(app.getHttpServer())
      .delete(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();

    expect(response.status).toEqual(404);
  });

  it("DELETE rejects removing a GS1 identity from a published passport with 409", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id, { published: true });
    await ctx
      .getModuleRef()
      .get(UniqueProductIdentifierRepository)
      .save(
        UniqueProductIdentifier.createGs1({ referenceId: passport.id, gtin: "00990000000127" }),
      );

    const response = await request(app.getHttpServer())
      .delete(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();

    expect(response.status).toEqual(409);

    // The frozen identity must remain intact after a rejected removal.
    const repo = ctx.getModuleRef().get(UniqueProductIdentifierRepository);
    expect(
      await repo.findByReferenceIdAndType(passport.id, ExternalIdentifierType.GS1),
    ).toBeDefined();
  });

  it("PUT assigns a GTIN with batch and serial and returns the full Digital Link", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id);

    const response = await request(app.getHttpServer())
      .put(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send({ gtin: VALID_GTIN13, batch: "LOT-42", serial: "SN-001" });

    expect(response.status).toEqual(200);
    expect(response.body.gtin).toEqual(VALID_GTIN13_AS_14);
    expect(response.body.batch).toEqual("LOT-42");
    expect(response.body.serial).toEqual("SN-001");
    expect(response.body.digitalLink).toMatch(
      new RegExp(`/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001$`),
    );
  });

  it("PUT clears a previously-set batch / serial when omitted", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id);
    await ctx
      .getModuleRef()
      .get(UniqueProductIdentifierRepository)
      .save(
        UniqueProductIdentifier.createGs1({
          referenceId: passport.id,
          gtin: "88000000000107",
          batch: "OLD-LOT",
          serial: "OLD-SN",
        }),
      );

    const response = await request(app.getHttpServer())
      .put(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send({ gtin: "88000000000107", batch: "", serial: "" });

    expect(response.status).toEqual(200);
    expect(response.body.batch).toBeNull();
    expect(response.body.serial).toBeNull();
  });

  it("PUT rejects a serial outside CSET-82 with 400", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id);

    const response = await request(app.getHttpServer())
      .put(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send({ gtin: VALID_GTIN13, serial: "bad value" });

    expect(response.status).toEqual(400);
  });

  it("PUT allows two passports to share a GTIN with distinct serials", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const sharedGtin = "00075678164125";
    const first = await createPassport(org!.id);
    const second = await createPassport(org!.id);

    const firstResponse = await request(app.getHttpServer())
      .put(`${basePath}/${first.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send({ gtin: sharedGtin, serial: "SN-A" });
    expect(firstResponse.status).toEqual(200);

    const secondResponse = await request(app.getHttpServer())
      .put(`${basePath}/${second.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send({ gtin: sharedGtin, serial: "SN-B" });
    expect(secondResponse.status).toEqual(200);
  });

  it("PUT builds the Digital Link against the organization's resolver override", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const gtin = "00445566778800";
    await ctx
      .getModuleRef()
      .get(BrandingRepository)
      .save(
        Branding.create({
          organizationId: org!.id,
          gs1ResolverBaseUrl: "https://id.acme.example",
        }),
      );
    const passport = await createPassport(org!.id);

    const response = await request(app.getHttpServer())
      .put(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send({ gtin });

    expect(response.status).toEqual(200);
    expect(response.body.digitalLink).toEqual(`https://id.acme.example/01/${gtin}`);
  });

  it("GET reflects the organization's resolver override in the Digital Link", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const gtin = "00778899001100";
    await ctx
      .getModuleRef()
      .get(BrandingRepository)
      .save(
        Branding.create({
          organizationId: org!.id,
          gs1ResolverBaseUrl: "https://id.override.example",
        }),
      );
    const passport = await createPassport(org!.id);
    await ctx
      .getModuleRef()
      .get(UniqueProductIdentifierRepository)
      .save(UniqueProductIdentifier.createGs1({ referenceId: passport.id, gtin }));

    const response = await request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();

    expect(response.status).toEqual(200);
    expect(response.body.digitalLink).toEqual(`https://id.override.example/01/${gtin}`);
  });

  it("PUT rejects a duplicate full key (same gtin + serial) with 409", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const sharedGtin = "00036000291452";
    const other = await createPassport(org!.id);
    await ctx
      .getModuleRef()
      .get(UniqueProductIdentifierRepository)
      .save(
        UniqueProductIdentifier.createGs1({
          referenceId: other.id,
          gtin: sharedGtin,
          serial: "DUP-SN",
        }),
      );
    const passport = await createPassport(org!.id);

    const response = await request(app.getHttpServer())
      .put(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send({ gtin: sharedGtin, serial: "DUP-SN" });

    expect(response.status).toEqual(409);
  });
});
