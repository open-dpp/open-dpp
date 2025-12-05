import { randomUUID } from "node:crypto";

import { Environment } from "../../aas/domain/environment";

import { createAasTestContext } from "../../aas/presentation/aas.test.context";
import { Passport } from "../domain/passport";
import { PassportRepository } from "../infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../infrastructure/passport.schema";
import { PassportsModule } from "../passports.module";
import { PassportController } from "./passport.controller";

describe("passportController", () => {
  const ctx = createAasTestContext("/passports", { imports: [PassportsModule], providers: [PassportRepository], controllers: [PassportController] }, [{ name: PassportDoc.name, schema: PassportSchema }], PassportRepository);

  async function createPassport(orgId: string): Promise<Passport> {
    const { aas, submodels } = ctx.getAasObjects();
    return ctx.getDppIdentifiableRepository().save(Passport.create({
      id: randomUUID(),
      organizationId: orgId,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map(s => s.id),
        conceptDescriptions: [],
      }),
    }));
  }

  it(`/GET shells`, async () => {
    await ctx.asserts.getShells(createPassport);
  });

  it(`/GET submodels`, async () => {
    await ctx.asserts.getSubmodels(createPassport);
  });
  //
  it(`/GET submodel by id`, async () => {
    await ctx.asserts.getSubmodelById(createPassport);
  });

  it(`/GET submodel elements`, async () => {
    await ctx.asserts.getSubmodelElements(createPassport);
  });
});
