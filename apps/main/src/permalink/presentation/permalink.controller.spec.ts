import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { getModelToken } from "@nestjs/mongoose";
import { PermalinkKind, PresentationReferenceType } from "@open-dpp/dto";
import type { Model } from "mongoose";
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
  const basePath = "/p";
  const ctx = createAasTestContext(
    basePath,
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

  it(`/GET by passport id stays consistent for a non-member of a draft passport that has permalinks`, async () => {
    const fixture = await createPassportWithPermalink({ published: false });

    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/p?passportId=${fixture.passport.id}`,
    );

    expect(response.status).toEqual(200);
    expect(response.body).toEqual([]);
  });

  describe("GET /p?passportId=... — NoSQL injection hardening", () => {
    it.each([
      ["passportId[$gt]=", "$gt operator object"],
      ["passportId[$ne]=", "$ne operator object"],
      ["passportId[$regex]=.*", "$regex operator object"],
      ["passportId=not-a-uuid", "non-UUID string"],
      ["", "missing passportId"],
    ])("rejects %s with 400 (%s)", async (queryString) => {
      const response = await request(ctx.globals().app.getHttpServer()).get(
        `/p${queryString.length > 0 ? `?${queryString}` : ""}`,
      );
      expect(response.status).toEqual(400);
    });

    it("returns 200 with empty list for a valid but unknown UUID", async () => {
      const response = await request(ctx.globals().app.getHttpServer()).get(
        `/p?passportId=${randomUUID()}`,
      );
      expect(response.status).toEqual(200);
      expect(response.body).toEqual([]);
    });
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
      expect(response.body.publicUrl).toEqual(`https://passports.example.com/${permalink.id}`);
      expect(typeof response.body.fallbackBaseUrl).toBe("string");
      expect(["branding", "instance"]).toContain(response.body.fallbackBaseUrlSource);

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
        .send({ baseUrl: "https://example.com?q=1" });

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
      expect(response.body.publicUrl).toEqual(`https://passports.example.com/${slug}`);
    });
  });

  describe("GET /p/:id — publicUrl resolution", () => {
    it("uses permalink.baseUrl when set (highest precedence)", async () => {
      const fixture = await createPassportWithPermalink();
      const seeded = fixture.permalink.withBaseUrl("https://override.example.com");
      await ctx.getModuleRef().get(PermalinkRepository).save(seeded);

      const response = await request(ctx.globals().app.getHttpServer()).get(`/p/${fixture.id}`);

      expect(response.status).toEqual(200);
      expect(response.body.publicUrl).toEqual(`https://override.example.com/${fixture.id}`);
    });

    it("falls back to OPEN_DPP_URL when neither permalink nor branding has a base URL", async () => {
      const fixture = await createPassportWithPermalink();

      const response = await request(ctx.globals().app.getHttpServer()).get(`/p/${fixture.id}`);

      expect(response.status).toEqual(200);
      expect(typeof response.body.publicUrl).toBe("string");
      expect(response.body.publicUrl).toMatch(new RegExp(`/p/${fixture.id}$`));
    });
  });

  describe("GET /p — fallbackBaseUrl resolution", () => {
    async function seedBranding(organizationId: string, permalinkBaseUrl: string) {
      const model = ctx.getModuleRef().get<Model<BrandingDoc>>(getModelToken(BrandingDoc.name));
      await model.create({ organizationId, permalinkBaseUrl });
    }

    it("attributes to 'branding' and returns the branding value when the org has a permalinkBaseUrl", async () => {
      const fixture = await createPassportWithPermalink();
      await seedBranding(fixture.passport.organizationId, "https://branding.example.com");

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/p`)
        .query({ passportId: fixture.passport.id });

      expect(response.status).toEqual(200);
      expect(response.body[0].fallbackBaseUrl).toEqual("https://branding.example.com");
      expect(response.body[0].fallbackBaseUrlSource).toEqual("branding");
    });

    it("attributes to 'instance' and returns the OPEN_DPP_URL origin when branding has no permalinkBaseUrl", async () => {
      const fixture = await createPassportWithPermalink();

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/p`)
        .query({ passportId: fixture.passport.id });

      expect(response.status).toEqual(200);
      expect(response.body[0].fallbackBaseUrlSource).toEqual("instance");
      expect(response.body[0].fallbackBaseUrl).toEqual(process.env.OPEN_DPP_PERMALINK_BASE_URL);
    });

    it("returns the post-override fallback even when permalink.baseUrl is set", async () => {
      const fixture = await createPassportWithPermalink();
      await seedBranding(fixture.passport.organizationId, "https://branding.example.com");
      const seeded = fixture.permalink.withBaseUrl("https://override.example.com");
      await ctx.getModuleRef().get(PermalinkRepository).save(seeded);

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/p`)
        .query({ passportId: fixture.passport.id });

      expect(response.status).toEqual(200);
      expect(response.body[0].baseUrl).toEqual("https://override.example.com");
      expect(response.body[0].publicUrl).toEqual(`https://override.example.com/${fixture.id}`);
      expect(response.body[0].fallbackBaseUrl).toEqual("https://branding.example.com");
      expect(response.body[0].fallbackBaseUrlSource).toEqual("branding");
    });
  });

  describe("GET — lazy freeze on resolve (rule c)", () => {
    it("freezes and persists publishedUrl on first public resolve of a published passport", async () => {
      const slug = `lazy-${randomUUID().slice(0, 8)}`;
      const fixture = await createPassportWithPermalink({ slug });
      await ctx
        .getModuleRef()
        .get<Model<BrandingDoc>>(getModelToken(BrandingDoc.name))
        .create({ organizationId: fixture.passport.organizationId });
      const repo = ctx.getModuleRef().get(PermalinkRepository);
      expect((await repo.findOneOrFail(fixture.id)).publishedUrl).toBeNull();

      const response = await request(ctx.globals().app.getHttpServer()).get(`/p/${fixture.id}`);

      expect(response.status).toEqual(200);
      const persisted = (await repo.findOneOrFail(fixture.id)).publishedUrl;
      expect(persisted).toEqual(response.body.publicUrl);
      expect(persisted).toEqual(`http://localhost:3000/p/${slug}`);
    });

    it("keeps the frozen URL even after the org branding base URL changes (immutability)", async () => {
      const slug = `imm-${randomUUID().slice(0, 8)}`;
      const fixture = await createPassportWithPermalink({ slug });
      const brandingModel = ctx
        .getModuleRef()
        .get<Model<BrandingDoc>>(getModelToken(BrandingDoc.name));
      await brandingModel.create({ organizationId: fixture.passport.organizationId });

      await request(ctx.globals().app.getHttpServer()).get(`/p/${fixture.id}`);
      const repo = ctx.getModuleRef().get(PermalinkRepository);
      const frozenUrl = (await repo.findOneOrFail(fixture.id)).publishedUrl;

      await brandingModel.updateOne(
        { organizationId: fixture.passport.organizationId },
        { $set: { permalinkBaseUrl: "https://changed.example.com" } },
      );

      const response = await request(ctx.globals().app.getHttpServer()).get(`/p/${fixture.id}`);

      expect(response.status).toEqual(200);
      expect(response.body.publicUrl).toEqual(frozenUrl);
      expect(response.body.publicUrl).toEqual(`http://localhost:3000/p/${slug}`);
    });

    it("does not freeze a draft passport's permalink on resolve", async () => {
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
      const refetched = await ctx
        .getModuleRef()
        .get(PermalinkRepository)
        .findOneOrFail(permalink.id);
      expect(refetched.publishedUrl).toBeNull();
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

    const countAfter = await presentationConfigurationRepository.countByReference(referenceFilter);
    expect(countAfter).toEqual(1);
  });

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
        .get("/permalinks")
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
        gs1ResolverBase: null,
        gs1DataAttributes: null,
        primary: false,
        organizationId: org.id,
      });
      await ctx.getModuleRef().get(PermalinkRepository).save(gs1Permalink);

      const response = await request(ctx.globals().app.getHttpServer())
        .get("/permalinks")
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
        .get("/permalinks")
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
            gs1ResolverBase: null,
            gs1DataAttributes: null,
            primary: false,
            organizationId: org.id,
          }),
        );
      }

      const page1 = await request(ctx.globals().app.getHttpServer())
        .get("/permalinks")
        .query({ limit: 2 })
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(page1.status).toEqual(200);
      expect(page1.body.result).toHaveLength(2);
      expect(page1.body.paging_metadata.cursor).toBeTruthy();

      const page2 = await request(ctx.globals().app.getHttpServer())
        .get("/permalinks")
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
        .get("/permalinks")
        .set("Cookie", userCookie);

      expect(response.status).toEqual(400);
    });

    it("(d) returns 403 when the requester is not a member of the org", async () => {
      const { org } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const nonMember = await ctx.globals().betterAuthHelper.createUser();
      const nonMemberCookie = await ctx.globals().betterAuthHelper.signAsUser(nonMember.user.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .get("/permalinks")
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
        gs1ResolverBase: null,
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
        .get(`/passports/${passport.id}/permalinks`)
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
        .get(`/passports/${first.passport.id}/permalinks`)
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
        .get(`/passports/${passport.id}/permalinks`)
        .query({ limit: 1 })
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);
      expect(page1.status).toEqual(200);
      expect(page1.body.result).toHaveLength(1);
      expect(page1.body.paging_metadata.cursor).toBeTruthy();

      const page2 = await request(ctx.globals().app.getHttpServer())
        .get(`/passports/${passport.id}/permalinks`)
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
        .get(`/passports/${passport.id}/permalinks`)
        .set("Cookie", outsider.userCookie)
        .set(ORGANIZATION_ID_HEADER, outsider.org.id);

      expect(response.status).toEqual(403);
    });

    it("returns 404 when the passport does not exist", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(ctx.globals().app.getHttpServer())
        .get(`/passports/${randomUUID()}/permalinks`)
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
        .get(`/passports/${passport.id}/permalinks`)
        .set("Cookie", userCookie);

      expect(response.status).toEqual(400);
    });
  });

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
        .post("/permalinks")
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
    });

    it("(b) returns 409 when a second gs1-link is created for the same UPI", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { passport } = await createPassportWithConfig(org.id);
      const upi = await createGs1Upi(org.id, passport.id);

      await request(ctx.globals().app.getHttpServer())
        .post("/permalinks")
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({ kind: PermalinkKind.GS1_LINK, uniqueProductIdentifierId: upi.uuid });

      const response = await request(ctx.globals().app.getHttpServer())
        .post("/permalinks")
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
        .post("/permalinks")
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
        .post("/permalinks")
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
        .post("/permalinks")
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
        .post("/permalinks")
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
        gs1ResolverBase: null,
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

    it("(a) sets gs1DataAttributes and gs1ResolverBase on a gs1-link permalink → 200, reflected", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createGs1LinkPermalinkInOrg(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/permalinks/${permalink.id}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id)
        .send({
          gs1DataAttributes: { "17": "251231" },
          gs1ResolverBase: "https://resolver.gs1.org",
        });

      expect(response.status).toEqual(200);
      expect(response.body.gs1DataAttributes).toEqual({ "17": "251231" });
      expect(response.body.gs1ResolverBase).toEqual("https://resolver.gs1.org");
    });

    it("(b) rejects an invalid GS1 AI value with 400", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();
      const { permalink } = await createGs1LinkPermalinkInOrg(org.id);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/permalinks/${permalink.id}`)
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
        .patch(`/permalinks/${permalink.id}`)
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
      const frozen = permalink.withPublishedUrl(
        `https://passports.example.com/${permalink.id}`,
      );
      await ctx.getModuleRef().get(PermalinkRepository).save(frozen);

      const response = await request(ctx.globals().app.getHttpServer())
        .patch(`/permalinks/${permalink.id}`)
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
        .patch(`/permalinks/${permalink.id}`)
        .set("Cookie", outsider.userCookie)
        .set(ORGANIZATION_ID_HEADER, outsider.org.id)
        .send({ gs1ResolverBase: "https://resolver.gs1.org" });

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
        gs1ResolverBase: null,
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
        .delete(`/permalinks/${nonPrimaryPermalink.id}`)
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
        .delete(`/permalinks/${permalink.id}`)
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
        .delete(`/permalinks/${frozen.id}`)
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
        .delete(`/permalinks/${permalink.id}`)
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
        .delete(`/permalinks/${nonPrimaryPermalink.id}`)
        .set("Cookie", outsider.userCookie)
        .set(ORGANIZATION_ID_HEADER, outsider.org.id);

      expect(response.status).toEqual(403);
    });

    it("(f) DELETE unknown id → 404", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(ctx.globals().app.getHttpServer())
        .delete(`/permalinks/${randomUUID()}`)
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
        gs1ResolverBase: null,
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
        .post(`/permalinks/${nonPrimaryPermalink.id}/primary`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(200);
      expect(response.body.id).toEqual(nonPrimaryPermalink.id);
      expect(response.body.primary).toBe(true);

      // Verify the previously-primary sibling flipped to primary:false via a follow-up GET
      const listResponse = await request(ctx.globals().app.getHttpServer())
        .get("/permalinks")
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
        .post(`/permalinks/${permalink.id}/primary`)
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
        .post(`/permalinks/${nonPrimaryPermalink.id}/primary`)
        .set("Cookie", outsider.userCookie)
        .set(ORGANIZATION_ID_HEADER, outsider.org.id);

      expect(response.status).toEqual(403);
    });

    it("(d) unknown id → 404", async () => {
      const { org, userCookie } = await ctx
        .globals()
        .betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(ctx.globals().app.getHttpServer())
        .post(`/permalinks/${randomUUID()}/primary`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, org.id);

      expect(response.status).toEqual(404);
    });
  });
});
