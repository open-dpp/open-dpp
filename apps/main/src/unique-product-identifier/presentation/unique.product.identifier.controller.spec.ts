import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
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
import { Permalink } from "../../permalink/domain/permalink";
import { PermalinkRepository } from "../../permalink/infrastructure/permalink.repository";
import { PermalinkDoc, PermalinkSchema } from "../../permalink/infrastructure/permalink.schema";
import { PresentationConfiguration } from "../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { PresentationConfigurationsModule } from "../../presentation-configurations/presentation-configurations.module";
import { UniqueProductIdentifierRepository } from "../infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierModule } from "../unique.product.identifier.module";
import { UniqueProductIdentifierController } from "./unique.product.identifier.controller";
import { BrandingDoc, BrandingSchema } from "../../branding/infrastructure/branding.schema";

describe("UniqueProductIdentifierController (legacy redirects)", () => {
  const basePath = "/unique-product-identifiers";
  const ctx = createAasTestContext(
    basePath,
    {
      imports: [UniqueProductIdentifierModule, PresentationConfigurationsModule],
      providers: [
        UniqueProductIdentifierRepository,
        PassportRepository,
        BrandingRepository,
        PermalinkRepository,
        PresentationConfigurationRepository,
      ],
      controllers: [UniqueProductIdentifierController],
    },
    [
      { name: PassportDoc.name, schema: PassportSchema },
      { name: BrandingDoc.name, schema: BrandingSchema },
      { name: UniqueProductIdentifierDoc.name, schema: UniqueProductIdentifierSchema },
      { name: PermalinkDoc.name, schema: PermalinkSchema },
      { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
    ],
    UniqueProductIdentifierRepository,
    SubjectAttributes.create({ userRole: UserRole.ANONYMOUS }),
  );

  async function seedLegacyChain() {
    const organizationId = randomUUID();
    const passport = Passport.create({
      id: randomUUID(),
      organizationId,
      environment: Environment.create({
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      }),
    });
    const upi = passport.createUniqueProductIdentifier();
    const config = PresentationConfiguration.create({
      organizationId,
      referenceId: passport.id,
      referenceType: PresentationReferenceType.Passport,
    });
    const permalink = Permalink.create({ presentationConfigurationId: config.id });

    await ctx.getModuleRef().get(PassportRepository).save(passport);
    await ctx.getRepositories().dppIdentifiableRepository.save(upi);
    await ctx.getModuleRef().get(PresentationConfigurationRepository).save(config);
    await ctx.getModuleRef().get(PermalinkRepository).save(permalink);

    return { upi, passport, config, permalink };
  }

  it("302-redirects the ?reference query to /p", async () => {
    const { passport } = await seedLegacyChain();
    const response = await request(ctx.globals().app.getHttpServer())
      .get(`/unique-product-identifiers?reference=${passport.id}`)
      .redirects(0);

    expect(response.status).toEqual(302);
    expect(response.headers.location).toEqual(`/p?passportId=${passport.id}`);
  });

  it("302-redirects /passport to the permalink", async () => {
    const { upi, permalink } = await seedLegacyChain();
    const response = await request(ctx.globals().app.getHttpServer())
      .get(`/unique-product-identifiers/${upi.uuid}/passport`)
      .redirects(0);

    expect(response.status).toEqual(302);
    expect(response.headers.location).toEqual(`/p/${permalink.id}/passport`);
  });

  it("302-redirects nested submodel paths", async () => {
    const { upi, permalink } = await seedLegacyChain();
    const submodelId = "c3VibW9kZWwtMQ==";
    const response = await request(ctx.globals().app.getHttpServer())
      .get(`/unique-product-identifiers/${upi.uuid}/submodels/${submodelId}/$value`)
      .redirects(0);

    expect(response.status).toEqual(302);
    expect(response.headers.location).toEqual(`/p/${permalink.id}/submodels/${submodelId}/$value`);
  });

  it("returns 404 for unknown UPI uuid", async () => {
    const response = await request(ctx.globals().app.getHttpServer()).get(
      `/unique-product-identifiers/${randomUUID()}/passport`,
    );
    expect(response.status).toEqual(404);
  });
});
