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

  // ---------------------------------------------------------------------------
  // GET /passports/:id/gs1-identity
  // ---------------------------------------------------------------------------

  it("GET returns the most-recently-created GS1 UPI's identity when the passport has two", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id);
    const repo = ctx.getModuleRef().get(UniqueProductIdentifierRepository);

    // First UPI: serial SN-FIRST
    await repo.save(
      UniqueProductIdentifier.createGs1({
        referenceId: passport.id,
        gtin: VALID_GTIN13,
        serial: "SN-FIRST",
      }),
    );

    // Small delay so that the second UPI gets a later createdAt timestamp.
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Second (most-recent) UPI: serial SN-SECOND
    await repo.save(
      UniqueProductIdentifier.createGs1({
        referenceId: passport.id,
        gtin: VALID_GTIN13,
        serial: "SN-SECOND",
      }),
    );

    const response = await request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();

    expect(response.status).toEqual(200);
    // Must be the SECOND (most-recently-created) UPI's serial, not the first.
    expect(response.body.serial).toEqual("SN-SECOND");
    expect(response.body.gtin).toEqual(VALID_GTIN13_AS_14);
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
          permalinkBaseUrl: "https://id.override.example",
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

  // ---------------------------------------------------------------------------
  // PUT and DELETE routes are retired — they must now respond 404 (not found)
  // ---------------------------------------------------------------------------

  it("PUT /:id/gs1-identity → 404 (write route retired in Slice 44)", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id);

    const response = await request(app.getHttpServer())
      .put(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send({ gtin: VALID_GTIN13 });

    expect(response.status).toEqual(404);
  });

  it("DELETE /:id/gs1-identity → 404 (write route retired in Slice 44)", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();
    const passport = await createPassport(org!.id);
    // Seed a GS1 UPI so the old DELETE would have returned 204; now the retired
    // route must return 404 (route-not-found). Use a unique serial to avoid GS1
    // key-index conflicts across tests (the index covers gtin+batch+serial).
    await ctx
      .getModuleRef()
      .get(UniqueProductIdentifierRepository)
      .save(
        UniqueProductIdentifier.createGs1({
          referenceId: passport.id,
          gtin: VALID_GTIN13,
          serial: "DELETE-RETIRE-TEST",
        }),
      );

    const response = await request(app.getHttpServer())
      .delete(`${basePath}/${passport.id}/gs1-identity`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org!.id)
      .send();

    expect(response.status).toEqual(404);
  });
});
