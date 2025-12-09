import { randomUUID } from "node:crypto";

import { Environment } from "../../aas/domain/environment";

import { createAasTestContext } from "../../aas/presentation/aas.test.context";
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../infrastructure/template.schema";
import { TemplatesModule } from "../templates.module";
import { TemplateController } from "./template.controller";

describe("templateController", () => {
  const ctx = createAasTestContext("/templates", { imports: [TemplatesModule], providers: [TemplateRepository], controllers: [TemplateController] }, [{ name: TemplateDoc.name, schema: TemplateSchema }], TemplateRepository);

  async function createTemplate(orgId: string): Promise<Template> {
    const { aas, submodels } = ctx.getAasObjects();
    return ctx.getDppIdentifiableRepository().save(Template.create({
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
    await ctx.asserts.getShells(createTemplate);
  });

  it(`/GET submodels`, async () => {
    await ctx.asserts.getSubmodels(createTemplate);
  });
  //
  it(`/GET submodel by id`, async () => {
    await ctx.asserts.getSubmodelById(createTemplate);
  });

  it(`/GET submodel elements`, async () => {
    await ctx.asserts.getSubmodelElements(createTemplate);
  });

  it(`/GET submodel element by id`, async () => {
    await ctx.asserts.getSubmodelElementById(createTemplate);
  });
});
