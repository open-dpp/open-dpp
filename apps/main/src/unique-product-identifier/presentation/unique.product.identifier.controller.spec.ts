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
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../passports/infrastructure/passport.schema";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "../infrastructure/unique-product-identifier.service";
import { UniqueProductIdentifierModule } from "../unique.product.identifier.module";
import { UniqueProductIdentifierApplicationService } from "./unique.product.identifier.application.service";
import { UniqueProductIdentifierController } from "./unique.product.identifier.controller";
import { BrandingDoc, BrandingSchema } from "../../branding/infrastructure/branding.schema";

describe("uniqueProductIdentifierController", () => {
  const basePath = "/unique-product-identifiers";
  const ctx = createAasTestContext(
    basePath,
    {
      imports: [UniqueProductIdentifierModule],
      providers: [
        UniqueProductIdentifierService,
        PassportRepository,
        BrandingRepository,
        UniqueProductIdentifierService,
        UniqueProductIdentifierApplicationService,
      ],
      controllers: [UniqueProductIdentifierController],
    },
    [
      {
        name: PassportDoc.name,
        schema: PassportSchema,
      },
      {
        name: BrandingDoc.name,
        schema: BrandingSchema,
      },
      {
        name: UniqueProductIdentifierDoc.name,
        schema: UniqueProductIdentifierSchema,
      },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
    ],
    UniqueProductIdentifierService,
    SubjectAttributes.create({ userRole: UserRole.ANONYMOUS }),
  );

  async function createPassportWithUniqueProductIdentifier() {
    const { aas, submodels } = ctx.getAasObjects();

    const environment = Environment.create({
      assetAdministrationShells: [aas.id],
      submodels: submodels.map((s) => s.id),
      conceptDescriptions: [],
    });

    const passport = Passport.create({
      id: randomUUID(),
      organizationId: randomUUID(),
      environment,
    });

    const upid = passport.createUniqueProductIdentifier();

    await ctx.getRepositories().dppIdentifiableRepository.save(upid);
    await ctx.getModuleRef().get(PassportRepository).save(passport);

    const persistable = {
      id: upid.uuid,
      upid,
      getOrganizationId: () => passport.organizationId,
      getEnvironment: () => environment,
      toPlain: () => ({ id: upid.uuid }),
      passport,
    };

    return persistable;
  }

  it(`/GET passport from unique product identifier`, async () => {
    const { userCookie } = await ctx
      .globals()
      .betterAuthHelper.getUserWithCookie(ctx.globals().userId);

    const upid = await createPassportWithUniqueProductIdentifier();

    const response = await request(ctx.globals().app.getHttpServer())
      .get(`/unique-product-identifiers/${upid.id}/passport`)
      .set("Cookie", userCookie);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      ...upid.passport.toPlain(),
      createdAt: upid.passport.createdAt.toISOString(),
      updatedAt: upid.passport.updatedAt.toISOString(),
    });
  });

  it(`/GET unique product identifier from reference`, async () => {
    const { userCookie } = await ctx
      .globals()
      .betterAuthHelper.getUserWithCookie(ctx.globals().userId);

    const upid = await createPassportWithUniqueProductIdentifier();

    const response = await request(ctx.globals().app.getHttpServer())
      .get(`/unique-product-identifiers?reference=${upid.passport.id}`)
      .set("Cookie", userCookie);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual([upid.upid.toPlain()]);
  });

  it(`/GET shells`, async () => {
    await ctx.asserts.getShells(createPassportWithUniqueProductIdentifier);
  });

  it(`/GET submodels`, async () => {
    await ctx.asserts.getSubmodels(createPassportWithUniqueProductIdentifier);
  });

  it(`/GET submodel by id`, async () => {
    await ctx.asserts.getSubmodelById(createPassportWithUniqueProductIdentifier);
  });

  it("/GET submodel value", async () => {
    await ctx.asserts.getSubmodelValue(createPassportWithUniqueProductIdentifier);
  });

  it(`/GET submodel elements`, async () => {
    await ctx.asserts.getSubmodelElements(createPassportWithUniqueProductIdentifier);
  });

  it(`/GET submodel element by id`, async () => {
    await ctx.asserts.getSubmodelElementById(createPassportWithUniqueProductIdentifier);
  });

  it(`/GET submodel element value`, async () => {
    await ctx.asserts.getSubmodelElementValue(createPassportWithUniqueProductIdentifier);
  });
});
