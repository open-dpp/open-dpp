import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { PresentationReferenceType } from "@open-dpp/dto";
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
import { PermalinkModule } from "../permalink.module";
import { PermalinkApplicationService } from "../application/services/permalink.application.service";

describe("PermalinkController", () => {
  const basePath = "/p";
  const ctx = createAasTestContext(
    basePath,
    {
      imports: [PermalinkModule, PresentationConfigurationsModule],
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
    // Use OWNER so the test context provisions an org for member-role tests
    // (PATCH /p/:id/slug); anonymous-readable GET tests still work because
    // their endpoints carry @OptionalAuth.
    SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.OWNER }),
  );

  async function createPassportWithPermalink(
    options: { slug?: string | null; published?: boolean } = {},
  ) {
    const { aas, submodels } = ctx.getAasObjects();

    const environment = Environment.create({
      assetAdministrationShells: [aas.id],
      submodels: submodels.map((s) => s.id),
      conceptDescriptions: [],
    });

    const organizationId = randomUUID();
    // Default to Published so the existing GET tests resolve via the public
    // anonymous path. Tests for draft visibility opt in with published: false.
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

    const permalink = Permalink.create({
      presentationConfigurationId: config.id,
      slug: options.slug ?? null,
    });

    await ctx.getModuleRef().get(PassportRepository).save(passport);
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
    await ctx.getRepositories().dppIdentifiableRepository.save(permalink);

    return {
      id: permalink.id,
      permalink,
      passport,
      config,
      getOrganizationId: () => passport.organizationId,
      getEnvironment: () => environment,
      toPlain: () => ({ id: permalink.id }),
    };
  }

  it(`/GET passport from permalink by UUID`, async () => {
    const { userCookie } = await ctx
      .globals()
      .betterAuthHelper.getUserWithCookie(ctx.globals().userId);

    const fixture = await createPassportWithPermalink();

    const response = await request(ctx.globals().app.getHttpServer())
      .get(`/p/${fixture.id}/passport`)
      .set("Cookie", userCookie);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      ...fixture.passport.toPlain(),
      createdAt: fixture.passport.createdAt.toISOString(),
      updatedAt: fixture.passport.updatedAt.toISOString(),
    });
  });

  it(`/GET passport from permalink by slug`, async () => {
    const slug = `slug-${randomUUID().slice(0, 8)}`;
    const fixture = await createPassportWithPermalink({ slug });

    const response = await request(ctx.globals().app.getHttpServer()).get(`/p/${slug}/passport`);

    expect(response.status).toEqual(200);
    expect(response.body.id).toEqual(fixture.passport.id);
  });

  it(`/GET returns 404 for unknown permalink id`, async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/p/${randomUUID()}/passport`,
    );

    expect(response.status).toEqual(404);
  });

  it(`/GET returns 404 for unknown slug`, async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/p/nonexistent-slug/passport`,
    );

    expect(response.status).toEqual(404);
  });

  it(`/GET permalink by passport id`, async () => {
    const fixture = await createPassportWithPermalink();

    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/p?passportId=${fixture.passport.id}`,
    );

    expect(response.status).toEqual(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toEqual(1);
    expect(response.body[0].id).toEqual(fixture.id);
  });

  it(`/GET permalink by passport id returns empty array when missing`, async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/p?passportId=${randomUUID()}`,
    );

    expect(response.status).toEqual(200);
    expect(response.body).toEqual([]);
  });

  it(`/GET rejects permalink when config is template-type`, async () => {
    const organizationId = randomUUID();
    const templateConfig = PresentationConfiguration.create({
      organizationId,
      referenceId: randomUUID(),
      referenceType: PresentationReferenceType.Template,
    });
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(templateConfig);
    const permalink = Permalink.create({ presentationConfigurationId: templateConfig.id });
    await ctx.getRepositories().dppIdentifiableRepository.save(permalink);

    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/p/${permalink.id}/passport`,
    );

    expect(response.status).toEqual(404);
  });

  it(`/GET shells`, async () => {
    await ctx.asserts.getShells(createPassportWithPermalink);
  });

  it(`/GET submodels`, async () => {
    await ctx.asserts.getSubmodels(createPassportWithPermalink);
  });

  it(`/GET submodel by id`, async () => {
    await ctx.asserts.getSubmodelById(createPassportWithPermalink);
  });

  it(`/GET submodel value`, async () => {
    await ctx.asserts.getSubmodelValue(createPassportWithPermalink);
  });

  it(`/GET submodel elements`, async () => {
    await ctx.asserts.getSubmodelElements(createPassportWithPermalink);
  });

  it(`/GET submodel element by id`, async () => {
    await ctx.asserts.getSubmodelElementById(createPassportWithPermalink);
  });

  it(`/GET submodel element value`, async () => {
    await ctx.asserts.getSubmodelElementValue(createPassportWithPermalink);
  });

  describe("draft passports — privacy gate", () => {
    it("returns 404 to anonymous when the passport is in draft", async () => {
      const fixture = await createPassportWithPermalink({ published: false });

      const response = await request(ctx.globals().app.getHttpServer()).get(
        `/p/${fixture.id}/passport`,
      );

      expect(response.status).toEqual(404);
    });

    it("returns 200 to a member of the owning org for a draft passport", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: org.id,
        environment: Environment.create({
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        }),
      });
      const config = PresentationConfiguration.createForPassport({
        organizationId: org.id,
        referenceId: passport.id,
      });
      const permalink = Permalink.create({ presentationConfigurationId: config.id });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
      await ctx.getRepositories().dppIdentifiableRepository.save(permalink);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/p/${permalink.id}/passport`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(200);
      expect(response.body.id).toEqual(passport.id);
    });

    it("returns 404 to a member of a different org for a draft passport", async () => {
      const { org: ownerOrg } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const outsider = await ctx.globals().betterAuthHelper.createOrganizationAndUserWithCookie();
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: ownerOrg.id,
        environment: Environment.create({
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        }),
      });
      const config = PresentationConfiguration.createForPassport({
        organizationId: ownerOrg.id,
        referenceId: passport.id,
      });
      const permalink = Permalink.create({ presentationConfigurationId: config.id });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
      await ctx.getRepositories().dppIdentifiableRepository.save(permalink);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/p/${permalink.id}/passport`)
        .set("Cookie", outsider.userCookie)
        .set(ORGANIZATION_ID_HEADER, outsider.org.id);

      expect(response.status).toEqual(404);
    });
  });

  describe("PATCH /p/:id/slug", () => {
    async function createPassportWithPermalinkInOrg(orgId: string, slug: string | null = null) {
      // PATCH tests publish the passport so the draft 404 gate doesn't shadow
      // the org-ownership check we want to exercise. Owner-of-draft is
      // exercised separately in the "draft passports" describe block.
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
        slug,
      });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
      await ctx.getRepositories().dppIdentifiableRepository.save(permalink);
      return { passport, config, permalink };
    }

    it("assigns a slug as a member of the owning org", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createPassportWithPermalinkInOrg(org.id);
      const slug = `slug-${randomUUID().slice(0, 8)}`;

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${permalink.id}/slug`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ slug });

      expect(response.status).toEqual(200);
      expect(response.body.id).toEqual(permalink.id);
      expect(response.body.slug).toEqual(slug);

      const refetched = await ctx
        .getModuleRef()
        .get(PermalinkRepository)
        .findOneOrFail(permalink.id);
      expect(refetched.slug).toEqual(slug);
    });

    it("clears a slug when the body sends slug: null", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const initialSlug = `slug-${randomUUID().slice(0, 8)}`;
      const { permalink } = await createPassportWithPermalinkInOrg(org.id, initialSlug);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${permalink.id}/slug`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ slug: null });

      expect(response.status).toEqual(200);
      expect(response.body.slug).toBeNull();
    });

    it("rejects an invalid slug with 400", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createPassportWithPermalinkInOrg(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${permalink.id}/slug`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ slug: "BAD SLUG" });

      expect(response.status).toEqual(400);
    });

    it("rejects a reserved slug with 400", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createPassportWithPermalinkInOrg(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${permalink.id}/slug`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ slug: "new" });

      expect(response.status).toEqual(400);
    });

    it("returns 409 on a duplicate slug", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const taken = `slug-${randomUUID().slice(0, 8)}`;
      await createPassportWithPermalinkInOrg(org.id, taken);
      const { permalink: target } = await createPassportWithPermalinkInOrg(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${target.id}/slug`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ slug: taken });

      expect(response.status).toEqual(409);
    });

    it("returns 403 when the requester's org does not own the passport", async () => {
      const { org: ownerOrg } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const outsider = await ctx.globals().betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createPassportWithPermalinkInOrg(ownerOrg.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${permalink.id}/slug`)
        .set("Cookie", outsider.userCookie)
        .set(ORGANIZATION_ID_HEADER, outsider.org.id)
        .send({ slug: "trespass" });

      expect(response.status).toEqual(403);
    });

    it("returns 401 / 403 when the request is anonymous", async () => {
      const { org } = await ctx.globals().betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createPassportWithPermalinkInOrg(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${permalink.id}/slug`)
        .send({ slug: "anon" });

      expect([401, 403]).toContain(response.status);
    });

    it("returns 404 when the permalink does not exist", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${randomUUID()}/slug`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ slug: "ghost" });

      expect(response.status).toEqual(404);
    });
  });

  it(`/GET presentation-configuration is anonymous readable and never materializes a row`, async () => {
    const fixture = await createPassportWithPermalink();
    const presentationConfigurationRepository = ctx
      .getModuleRef()
      .get(PresentationConfigurationRepository);

    const referenceFilter = {
      referenceType: "passport" as const,
      referenceId: fixture.passport.id,
    };

    const countBefore = await presentationConfigurationRepository.countByReference(referenceFilter);
    expect(countBefore).toEqual(1);

    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/p/${fixture.id}/presentation-configuration`,
    );

    expect(response.status).toEqual(200);
    expect(response.body.referenceType).toEqual("passport");
    expect(response.body.referenceId).toEqual(fixture.passport.id);

    // Anonymous read must NOT materialize a new row. The fixture already wrote one;
    // the count must remain unchanged.
    const countAfter = await presentationConfigurationRepository.countByReference(referenceFilter);
    expect(countAfter).toEqual(1);
  });
});
