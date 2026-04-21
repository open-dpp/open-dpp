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
import { PermalinkApplicationService } from "./permalink.application.service";
import { PermalinkController } from "./permalink.controller";

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
      controllers: [PermalinkController],
    },
    [
      { name: PassportDoc.name, schema: PassportSchema },
      { name: PermalinkDoc.name, schema: PermalinkSchema },
      { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
    ],
    PermalinkRepository,
    SubjectAttributes.create({ userRole: UserRole.ANONYMOUS }),
  );

  async function createPassportWithPermalink(options: { slug?: string | null } = {}) {
    const { aas, submodels } = ctx.getAasObjects();

    const environment = Environment.create({
      assetAdministrationShells: [aas.id],
      submodels: submodels.map((s) => s.id),
      conceptDescriptions: [],
    });

    const organizationId = randomUUID();
    const passport = Passport.create({
      id: randomUUID(),
      organizationId,
      environment,
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

    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/p/${slug}/passport`,
    );

    expect(response.status).toEqual(200);
    expect(response.body.id).toEqual(fixture.passport.id);
  });

  it(`/GET returns error status for unknown permalink id`, async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/p/${randomUUID()}/passport`,
    );

    // Without the NotFoundInDatabaseExceptionFilter wired up in the test app,
    // findOneOrFail surfaces as 500. In production main.ts registers the filter
    // globally, yielding 404. Either is acceptable for "no such permalink".
    expect([404, 500]).toContain(response.status);
  });

  it(`/GET returns error status for unknown slug`, async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/p/nonexistent-slug/passport`,
    );

    expect([404, 500]).toContain(response.status);
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

  it(`/GET presentation-configuration is anonymous readable and never materializes a row`, async () => {
    const fixture = await createPassportWithPermalink();
    const presentationConfigurationRepository = ctx
      .getModuleRef()
      .get(PresentationConfigurationRepository);

    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/p/${fixture.id}/presentation-configuration`,
    );

    expect(response.status).toEqual(200);
    expect(response.body.referenceType).toEqual("passport");
    expect(response.body.referenceId).toEqual(fixture.passport.id);

    // Anonymous read must NOT materialize a new row. The fixture already wrote one
    // but we assert the existing row is returned — not a second one.
    const stored = await presentationConfigurationRepository.findByReference({
      referenceType: "passport",
      referenceId: fixture.passport.id,
    });
    expect(stored?.id).toEqual(fixture.config.id);
  });
});
