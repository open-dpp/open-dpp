import { randomUUID } from "node:crypto";

import { expect, jest } from "@jest/globals";

import { AssetKind } from "@open-dpp/dto";
import request from "supertest";
import { LanguageText } from "../../aas/domain/common/language-text";
import { Environment } from "../../aas/domain/environment";
import { createAasTestContext } from "../../aas/presentation/aas.test.context";
import { DateTime } from "../../lib/date-time";
import { encodeCursor } from "../../pagination/pagination";
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../infrastructure/template.schema";
import { TemplatesModule } from "../templates.module";
import { TemplateController } from "./template.controller";

describe("templateController", () => {
  const basePath = "/templates";
  const ctx = createAasTestContext(
    basePath,
    { imports: [TemplatesModule], providers: [TemplateRepository], controllers: [TemplateController] },
    [{ name: TemplateDoc.name, schema: TemplateSchema }],
    TemplateRepository,
  );

  async function createTemplate(orgId: string, createdAt?: Date, updatedAt?: Date): Promise<Template> {
    const { aas, submodels } = ctx.getAasObjects();
    const template = Template.create({
      id: randomUUID(),
      organizationId: orgId,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map(s => s.id),
        conceptDescriptions: [],
      }),
      createdAt,
      updatedAt,
    });
    return ctx.getRepositories().dppIdentifiableRepository.save(template);
  }

  async function saveTemplate(template: Template): Promise<Template> {
    return ctx.getRepositories().dppIdentifiableRepository.save(template);
  }

  it(`/GET shells`, async () => {
    await ctx.asserts.getShells(createTemplate);
  });

  it(`/PATCH shell`, async () => {
    await ctx.asserts.modifyShell(createTemplate, saveTemplate);
  });

  it(`/GET submodels`, async () => {
    await ctx.asserts.getSubmodels(createTemplate);
  });

  it(`/POST submodel`, async () => {
    await ctx.asserts.postSubmodel(createTemplate);
  });

  it("/DELETE submodel", async () => {
    await ctx.asserts.deleteSubmodel(createTemplate, saveTemplate);
  });

  it(`/PATCH submodel`, async () => {
    await ctx.asserts.modifySubmodel(createTemplate, saveTemplate);
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

  it(`/DELETE submodel element`, async () => {
    await ctx.asserts.deleteSubmodelElement(createTemplate, saveTemplate);
  });

  it(`/PATCH submodel element`, async () => {
    await ctx.asserts.modifySubmodelElement(createTemplate, saveTemplate);
  });

  it(`/PATCH submodel element value`, async () => {
    await ctx.asserts.modifySubmodelElementValue(createTemplate, saveTemplate);
  });

  it("/POST add column", async () => {
    await ctx.asserts.addColumn(createTemplate, saveTemplate);
  });

  it("/PATCH modify column", async () => {
    await ctx.asserts.modifyColumn(createTemplate, saveTemplate);
  });

  it("/DELETE column", async () => {
    await ctx.asserts.deleteColumn(createTemplate, saveTemplate);
  });

  it("/POST add row", async () => {
    await ctx.asserts.addRow(createTemplate, saveTemplate);
  });

  it("/DELETE row", async () => {
    await ctx.asserts.deleteRow(createTemplate, saveTemplate);
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

  it("/GET all templates", async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-01-02T00:00:00.000Z");
    const date3 = new Date("2022-01-03T00:00:00.000Z");

    const t1 = await createTemplate(org.id, date1, date1);
    const t2 = await createTemplate(org.id, date2, date2);
    const t3 = await createTemplate(org.id, date3, date3);

    const response = await request(app.getHttpServer())
      .get(`${basePath}?limit=2&cursor=${encodeCursor(t3.createdAt.toISOString(), t3.id)}`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(200);
    expect(response.body.paging_metadata.cursor).toEqual(encodeCursor(t1.createdAt.toISOString(), t1.id));
    const expected = [t2.toPlain(), t1.toPlain()];
    expect(response.body.result).toEqual(expected.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })));
  });

  it(`/POST a template`, async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const now = new Date(
      "2022-01-01T00:00:00.000Z",
    );
    jest.spyOn(DateTime, "now").mockReturnValue(now);
    const displayName = [{ language: "en", text: "Test" }];

    const body = {
      environment: {
        assetAdministrationShells: [{ displayName }],
      },
    };
    const response = await request(app.getHttpServer())
      .post(basePath)
      .set("Cookie", userCookie)
      .send(body);
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
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    const foundAas = await ctx.getRepositories().aasRepository.findOneOrFail(response.body.environment.assetAdministrationShells[0]);
    expect(foundAas.assetInformation.assetKind).toEqual(AssetKind.Type);
    expect(foundAas.displayName).toEqual(displayName.map(LanguageText.fromPlain));
  });
});
