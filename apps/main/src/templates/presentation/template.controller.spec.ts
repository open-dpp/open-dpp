import { randomUUID } from "node:crypto";

import { expect } from "@jest/globals";

import { AssetKind } from "@open-dpp/aas";
import request from "supertest";
import { Environment } from "../../aas/domain/environment";
import { createAasTestContext } from "../../aas/presentation/aas.test.context";
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../infrastructure/template.schema";
import { TemplatesModule } from "../templates.module";
import { TemplateController } from "./template.controller";

describe("templateController", () => {
  const basePath = "/templates";
  const ctx = createAasTestContext(basePath, { imports: [TemplatesModule], providers: [TemplateRepository], controllers: [TemplateController] }, [{ name: TemplateDoc.name, schema: TemplateSchema }], TemplateRepository);

  async function createTemplate(orgId: string): Promise<Template> {
    const { aas, submodels } = ctx.getAasObjects();
    return ctx.getRepositories().dppIdentifiableRepository.save(Template.create({
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

  it(`/POST submodel`, async () => {
    await ctx.asserts.postSubmodel(createTemplate);
  });

  it(`/GET submodel by id`, async () => {
    await ctx.asserts.getSubmodelById(createTemplate);
  });

  it("/GET submodel value", async () => {
    await ctx.asserts.getSubmodelValue(createTemplate);
  });

  it(`/GET submodel elements`, async () => {
    await ctx.asserts.getSubmodelElements(createTemplate);
  });

  it(`/POST submodel element`, async () => {
    await ctx.asserts.postSubmodelElement(createTemplate);
  });

  it(`/POST submodel element at a specified path within submodel elements hierarchy`, async () => {
    await ctx.asserts.postSubmodelElementAtIdShortPath(createTemplate);
  });

  it(`/GET submodel element by id`, async () => {
    await ctx.asserts.getSubmodelElementById(createTemplate);
  });

  it(`/GET submodel element value`, async () => {
    await ctx.asserts.getSubmodelElementValue(createTemplate);
  });

  it(`/POST a template`, async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const response = await request(app.getHttpServer())
      .post(basePath)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      organizationId: org.id,
      environment: {
        assetAdministrationShells: [
          expect.any(String),
        ],
        submodels: [],
        conceptDescriptions: [],
      },
    });
    const foundAas = await ctx.getRepositories().aasRepository.findOneOrFail(response.body.environment.assetAdministrationShells[0]);
    expect(foundAas.assetInformation.assetKind).toEqual(AssetKind.Type);
  });
});
