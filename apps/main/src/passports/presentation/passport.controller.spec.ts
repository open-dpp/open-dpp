import { randomUUID } from "node:crypto";

import { Environment } from "../../aas/domain/environment";
import { createAasTestContext } from "../../aas/presentation/aas.test.context";
import { Template } from "../../templates/domain/template";
import { Passport } from "../domain/passport";
import { PassportRepository } from "../infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../infrastructure/passport.schema";
import { PassportsModule } from "../passports.module";
import { PassportController } from "./passport.controller";

describe("passportController", () => {
  const ctx = createAasTestContext("/passports", { imports: [PassportsModule], providers: [PassportRepository], controllers: [PassportController] }, [{ name: PassportDoc.name, schema: PassportSchema }], PassportRepository);

  async function createPassport(orgId: string): Promise<Passport> {
    const { aas, submodels } = ctx.getAasObjects();
    return ctx.getRepositories().dppIdentifiableRepository.save(Passport.create({
      id: randomUUID(),
      organizationId: orgId,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map(s => s.id),
        conceptDescriptions: [],
      }),
    }));
  }

  async function savePassport(passport: Passport): Promise<Template> {
    return ctx.getRepositories().dppIdentifiableRepository.save(passport);
  }

  it(`/GET shells`, async () => {
    await ctx.asserts.getShells(createPassport);
  });

  it(`/GET submodels`, async () => {
    await ctx.asserts.getSubmodels(createPassport);
  });

  it(`/POST submodel`, async () => {
    await ctx.asserts.postSubmodel(createPassport);
  });

  it(`/PATCH submodel`, async () => {
    await ctx.asserts.modifySubmodel(createPassport, savePassport);
  });

  //
  it(`/GET submodel by id`, async () => {
    await ctx.asserts.getSubmodelById(createPassport);
  });

  it("/GET submodel value", async () => {
    await ctx.asserts.getSubmodelValue(createPassport);
  });

  it(`/GET submodel elements`, async () => {
    await ctx.asserts.getSubmodelElements(createPassport);
  });

  it(`/POST submodel element`, async () => {
    await ctx.asserts.postSubmodelElement(createPassport);
  });

  it(`/PATCH submodel element`, async () => {
    await ctx.asserts.modifySubmodelElement(createPassport, savePassport);
  });

  it(`/PATCH submodel element value`, async () => {
    await ctx.asserts.modifySubmodelElementValue(createPassport, savePassport);
  });

  it(`/POST submodel element at a specified path within submodel elements hierarchy`, async () => {
    await ctx.asserts.postSubmodelElementAtIdShortPath(createPassport);
  });

  it(`/GET submodel element by id`, async () => {
    await ctx.asserts.getSubmodelElementById(createPassport);
  });

  it(`/GET submodel element value`, async () => {
    await ctx.asserts.getSubmodelElementValue(createPassport);
  });
});
