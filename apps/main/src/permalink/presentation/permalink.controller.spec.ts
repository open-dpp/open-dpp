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

  it(`/GET bundle from permalink by UUID`, async () => {
    const { userCookie } = await ctx
      .globals()
      .betterAuthHelper.getUserWithCookie(ctx.globals().userId);

    const fixture = await createPassportWithPermalink();

    const response = await request(ctx.globals().app.getHttpServer())
      .get(`/p/${fixture.id}`)
      .set("Cookie", userCookie);

    expect(response.status).toEqual(200);
    expect(response.body.passport.id).toEqual(fixture.passport.id);
    expect(response.body.branding).toBeDefined();
    expect(response.body.presentationConfiguration.id).toEqual(fixture.config.id);
  });

  it(`/GET bundle from permalink by slug`, async () => {
    const slug = `slug-${randomUUID().slice(0, 8)}`;
    const fixture = await createPassportWithPermalink({ slug });

    const response = await request(ctx.globals().app.getHttpServer()).get(`/p/${slug}`);

    expect(response.status).toEqual(200);
    expect(response.body.passport.id).toEqual(fixture.passport.id);
  });

  it(`/GET returns 404 for unknown permalink id`, async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get(`/p/${randomUUID()}`);

    expect(response.status).toEqual(404);
  });

  it(`/GET returns 404 for unknown slug`, async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get(`/p/nonexistent-slug`);

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

  describe("GET /p?passportId=... — lazy backfill for pre-refactor passports", () => {
    async function seedBarePassport(orgId: string) {
      const passport = Passport.create({
        id: randomUUID(),
        organizationId: orgId,
        environment: Environment.create({
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        }),
      });
      await ctx.getModuleRef().get(PassportRepository).save(passport);
      return passport;
    }

    it("synthesises config + permalink for a member of the owning org and returns the new permalink", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const passport = await seedBarePassport(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/p?passportId=${passport.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBeDefined();

      const config = await ctx
        .getModuleRef()
        .get(PresentationConfigurationRepository)
        .findByReference({
          referenceType: PresentationReferenceType.Passport,
          referenceId: passport.id,
        });
      expect(config).toBeDefined();

      const persistedPermalink = await ctx
        .getModuleRef()
        .get(PermalinkRepository)
        .findByPresentationConfigurationId(config!.id);
      expect(persistedPermalink).toBeDefined();
      expect(persistedPermalink!.id).toEqual(response.body[0].id);
    });

    it("returns the existing permalink without creating duplicates when it already exists", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const passport = await seedBarePassport(org.id);
      const config = PresentationConfiguration.createForPassport({
        organizationId: org.id,
        referenceId: passport.id,
      });
      const existingPermalink = Permalink.create({ presentationConfigurationId: config.id });
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
      await ctx.getModuleRef().get(PermalinkRepository).save(existingPermalink);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/p?passportId=${passport.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toEqual(existingPermalink.id);

      const allPermalinks = await ctx
        .getModuleRef()
        .get(PermalinkRepository)
        .findAllByPassportId(passport.id);
      expect(allPermalinks).toHaveLength(1);
    });

    it("returns [] for an anonymous caller and does not create rows", async () => {
      const orgId = randomUUID();
      const passport = await seedBarePassport(orgId);

      const response = await request(ctx.globals().app.getHttpServer()).get(
        `/p?passportId=${passport.id}`,
      );

      expect(response.status).toEqual(200);
      expect(response.body).toEqual([]);

      const config = await ctx
        .getModuleRef()
        .get(PresentationConfigurationRepository)
        .findByReference({
          referenceType: PresentationReferenceType.Passport,
          referenceId: passport.id,
        });
      expect(config).toBeUndefined();
    });

    it("returns [] for a member of a different org and does not create rows", async () => {
      const ownerOrgId = randomUUID();
      const passport = await seedBarePassport(ownerOrgId);
      const outsider = await ctx.globals().betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/p?passportId=${passport.id}`)
        .set("Cookie", outsider.userCookie)
        .set(ORGANIZATION_ID_HEADER, outsider.org.id);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual([]);

      const config = await ctx
        .getModuleRef()
        .get(PresentationConfigurationRepository)
        .findByReference({
          referenceType: PresentationReferenceType.Passport,
          referenceId: passport.id,
        });
      expect(config).toBeUndefined();
    });

    it("returns [] when the passport row is missing entirely (authenticated caller)", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const ghostPassportId = randomUUID();

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/p?passportId=${ghostPassportId}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual([]);
    });

    it("synthesises only the missing permalink when the config already exists", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const passport = await seedBarePassport(org.id);
      const config = PresentationConfiguration.createForPassport({
        organizationId: org.id,
        referenceId: passport.id,
      });
      await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/p?passportId=${passport.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(200);
      expect(response.body).toHaveLength(1);

      const persistedPermalink = await ctx
        .getModuleRef()
        .get(PermalinkRepository)
        .findByPresentationConfigurationId(config.id);
      expect(persistedPermalink).toBeDefined();
      expect(persistedPermalink!.id).toEqual(response.body[0].id);

      const configs = await ctx
        .getModuleRef()
        .get(PresentationConfigurationRepository)
        .findManyByReference({
          referenceType: PresentationReferenceType.Passport,
          referenceId: passport.id,
        });
      expect(configs).toHaveLength(1);
      expect(configs[0].id).toEqual(config.id);
    });
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

    const response = await request(ctx.globals().app.getHttpServer()).get(`/p/${permalink.id}`);

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

      const response = await request(ctx.globals().app.getHttpServer()).get(`/p/${fixture.id}`);

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
        .get(`/p/${permalink.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(200);
      expect(response.body.passport.id).toEqual(passport.id);
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
        .get(`/p/${permalink.id}`)
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
        .patch(`/p/${permalink.id}`)
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
        .patch(`/p/${permalink.id}`)
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
        .patch(`/p/${permalink.id}`)
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
        .patch(`/p/${permalink.id}`)
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
        .patch(`/p/${target.id}`)
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
        .patch(`/p/${permalink.id}`)
        .set("Cookie", outsider.userCookie)
        .set(ORGANIZATION_ID_HEADER, outsider.org.id)
        .send({ slug: "trespass" });

      expect(response.status).toEqual(403);
    });

    it("returns 401 / 403 when the request is anonymous", async () => {
      const { org } = await ctx.globals().betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createPassportWithPermalinkInOrg(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${permalink.id}`)
        .send({ slug: "anon" });

      expect([401, 403]).toContain(response.status);
    });

    it("succeeds for an org member when the passport is in Draft", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      // Build a draft passport directly so we exercise the privacy-gate
      // interaction with PATCH (the helper publishes by default).
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

      const slug = `slug-${randomUUID().slice(0, 8)}`;
      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${permalink.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ slug });

      expect(response.status).toEqual(200);
      expect(response.body.slug).toEqual(slug);
    });

    it("returns 404 when the permalink does not exist", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${randomUUID()}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ slug: "ghost" });

      expect(response.status).toEqual(404);
    });

    it("sets a baseUrl override", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createPassportWithPermalinkInOrg(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${permalink.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ baseUrl: "https://passports.example.com" });

      expect(response.status).toEqual(200);
      expect(response.body.baseUrl).toEqual("https://passports.example.com");
      expect(response.body.publicUrl).toEqual(`https://passports.example.com/p/${permalink.id}`);

      const refetched = await ctx
        .getModuleRef()
        .get(PermalinkRepository)
        .findOneOrFail(permalink.id);
      expect(refetched.baseUrl).toEqual("https://passports.example.com");
    });

    it("clears a baseUrl when the body sends baseUrl: null", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink: created } = await createPassportWithPermalinkInOrg(org.id);
      const seeded = created.withBaseUrl("https://passports.example.com");
      await ctx.getModuleRef().get(PermalinkRepository).save(seeded);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${created.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ baseUrl: null });

      expect(response.status).toEqual(200);
      expect(response.body.baseUrl).toBeNull();
    });

    it("rejects an invalid baseUrl with 400", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createPassportWithPermalinkInOrg(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${permalink.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ baseUrl: "https://example.com/with/path" });

      expect(response.status).toEqual(400);
    });

    it("updates slug and baseUrl together in one request", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createPassportWithPermalinkInOrg(org.id);
      const slug = `slug-${randomUUID().slice(0, 8)}`;

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/p/${permalink.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ slug, baseUrl: "https://passports.example.com" });

      expect(response.status).toEqual(200);
      expect(response.body.slug).toEqual(slug);
      expect(response.body.baseUrl).toEqual("https://passports.example.com");
      expect(response.body.publicUrl).toEqual(`https://passports.example.com/p/${slug}`);
    });
  });

  describe("GET /p/:id — publicUrl resolution", () => {
    it("uses permalink.baseUrl when set (highest precedence)", async () => {
      const fixture = await createPassportWithPermalink();
      const seeded = fixture.permalink.withBaseUrl("https://override.example.com");
      await ctx.getModuleRef().get(PermalinkRepository).save(seeded);

      const response = await request(ctx.globals().app.getHttpServer()).get(`/p/${fixture.id}`);

      expect(response.status).toEqual(200);
      expect(response.body.publicUrl).toEqual(`https://override.example.com/p/${fixture.id}`);
    });

    it("falls back to OPEN_DPP_URL when neither permalink nor branding has a base URL", async () => {
      const fixture = await createPassportWithPermalink();

      const response = await request(ctx.globals().app.getHttpServer()).get(`/p/${fixture.id}`);

      expect(response.status).toEqual(200);
      expect(typeof response.body.publicUrl).toBe("string");
      expect(response.body.publicUrl).toMatch(new RegExp(`/p/${fixture.id}$`));
    });
  });

  it(`/GET bundle is anonymous readable and never materializes a row`, async () => {
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

    const response = await request(ctx.globals().app.getHttpServer()).get(`/p/${fixture.id}`);

    expect(response.status).toEqual(200);
    expect(response.body.presentationConfiguration.referenceType).toEqual("passport");
    expect(response.body.presentationConfiguration.referenceId).toEqual(fixture.passport.id);

    // Anonymous read must NOT materialize a new row. The fixture already wrote one;
    // the count must remain unchanged.
    const countAfter = await presentationConfigurationRepository.countByReference(referenceFilter);
    expect(countAfter).toEqual(1);
  });
});
