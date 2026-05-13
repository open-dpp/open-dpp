import { randomUUID } from "node:crypto";

import { expect, jest } from "@jest/globals";

import { AssetKind, DigitalProductDocumentStatusModificationMethodDto } from "@open-dpp/dto";
import request from "supertest";
import {
  buildEmptyExportPayload,
  buildRichExportPayload,
} from "../../../test/export-payload.fixtures";
import { AssetAdministrationShell } from "../../aas/domain/asset-adminstration-shell";
import { LanguageText } from "../../aas/domain/common/language-text";
import { Environment } from "../../aas/domain/environment";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { Submodel } from "../../aas/domain/submodel-base/submodel";
import {
  ConceptDescriptionDoc,
  ConceptDescriptionSchema,
} from "../../aas/infrastructure/schemas/concept-description.schema";
import { AasSerializationService } from "../../aas/infrastructure/serialization/aas-serialization.service";
import { AasExportVersion } from "../../aas/infrastructure/serialization/export-schemas/aas-export-shared";
import { createAasTestContext } from "../../aas/presentation/aas.test.context";
import { ORGANIZATION_ID_HEADER } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { DateTime } from "../../lib/date-time";
import { encodeCursor } from "../../pagination/pagination";
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../infrastructure/template.schema";
import { TemplatesModule } from "../templates.module";
import { TemplateController } from "./template.controller";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
} from "../../digital-product-document/domain/digital-product-document-status";

describe("templateController", () => {
  const basePath = "/templates";
  const ctx = createAasTestContext(
    basePath,
    {
      imports: [TemplatesModule],
      providers: [TemplateRepository, AasSerializationService],
      controllers: [TemplateController],
    },
    [
      { name: TemplateDoc.name, schema: TemplateSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
    ],
    TemplateRepository,
    SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.OWNER }),
  );

  async function createTemplate(
    orgId?: string,
    createdAt?: Date,
    updatedAt?: Date,
    archived?: boolean,
  ): Promise<Template> {
    const { aas, submodels } = ctx.getAasObjects();
    const template = Template.create({
      id: randomUUID(),
      organizationId: orgId ?? randomUUID(),
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map((s) => s.id),
        conceptDescriptions: [],
      }),
      createdAt,
      updatedAt,
      lastStatusChange: DigitalProductDocumentStatusChange.create({
        currentStatus: archived
          ? DigitalProductDocumentStatus.Archived
          : DigitalProductDocumentStatus.Draft,
        previousStatus: archived ? DigitalProductDocumentStatus.Draft : undefined,
      }),
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

  it("/DELETE policy", async () => {
    await ctx.asserts.deletePolicy(createTemplate);
  });

  it("/DELETE submodel", async () => {
    await ctx.asserts.deleteSubmodel(createTemplate, saveTemplate);
  });

  it(`/PATCH submodel`, async () => {
    await ctx.asserts.modifySubmodel(createTemplate, saveTemplate);
  });

  it(`/PATCH submodel value`, async () => {
    await ctx.asserts.modifyValueOfSubmodel(createTemplate, saveTemplate);
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
    const { aas } = ctx.getAasObjects();

    const t1 = await createTemplate(org.id, date1, date1);
    const t2 = await createTemplate(org.id, date2, date2, true);
    const t3 = await createTemplate(org.id, date3, date3);

    let response = await request(app.getHttpServer())
      .get(
        `${basePath}?limit=2&cursor=${encodeCursor(t3.createdAt.toISOString(), t3.id)}&populate=environment.assetAdministrationShells`,
      )
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id);
    expect(response.status).toEqual(200);
    expect(response.body.paging_metadata.cursor).toEqual(
      encodeCursor(t1.createdAt.toISOString(), t1.id),
    );
    expect(response.body.result).toEqual(
      [t2, t1].map((t) => ({
        ...t.toPlain(),
        environment: {
          ...t.environment.toPlain(),
          assetAdministrationShells: [
            {
              id: aas.id,
              displayName: aas.displayName.map((d) => ({ language: d.language, text: d.text })),
            },
          ],
        },
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    );

    response = await request(app.getHttpServer())
      .get(`${basePath}?limit=2&cursor=${encodeCursor(t3.createdAt.toISOString(), t3.id)}`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id);
    expect(response.status).toEqual(200);
    expect(response.body.result).toEqual(
      [t2, t1].map((t) => ({
        ...t.toPlain(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    );

    response = await request(app.getHttpServer())
      .get(`${basePath}?status=Archived`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      paging_metadata: {
        cursor: expect.any(String),
      },
      result: [t2].map((p) => ({
        ...p.toPlain(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  });

  it(`/POST a template`, async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const now = new Date("2022-01-01T00:00:00.000Z");
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
      .set(ORGANIZATION_ID_HEADER, org.id)
      .send(body);
    expect(response.status).toEqual(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      organizationId: org.id,
      environment: {
        assetAdministrationShells: [expect.any(String)],
        submodels: [],
        conceptDescriptions: [],
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      lastStatusChange: {
        currentStatus: DigitalProductDocumentStatus.Draft,
        previousStatus: null,
      },
    });
    const foundAas = await ctx
      .getRepositories()
      .aasRepository.findOneOrFail(response.body.environment.assetAdministrationShells[0]);
    expect(foundAas.assetInformation.assetKind).toEqual(AssetKind.Type);
    expect(foundAas.displayName).toEqual(displayName.map(LanguageText.fromPlain));
  });

  it("/GET export template", async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const template = await createTemplate(org.id);

    const response = await request(app.getHttpServer())
      .get(`${basePath}/${template.id}/export`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id);

    expect(response.status).toEqual(200);
    expect(response.body.format).toEqual("open-dpp:json");
    expect(response.body.version).toEqual(AasExportVersion.v3_0);
    expect(response.body.id).toBeDefined();
    expect(response.body.environment).toBeDefined();
    expect(response.body.environment.assetAdministrationShells).toHaveLength(1);
    expect(response.body.environment.submodels).toHaveLength(2);
    expect(response.body.createdAt).toBeDefined();
    expect(response.body.updatedAt).toBeDefined();
  });

  it("/POST import template", async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const template = await createTemplate(org.id);

    const exportResponse = await request(app.getHttpServer())
      .get(`${basePath}/${template.id}/export`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id);
    expect(exportResponse.status).toEqual(200);

    const importResponse = await request(app.getHttpServer())
      .post(`${basePath}/import`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id)
      .send(exportResponse.body);

    expect(importResponse.status).toEqual(201);
    expect(importResponse.body.id).toBeDefined();
    expect(importResponse.body.id).not.toEqual(template.id);
    expect(importResponse.body.organizationId).toEqual(org.id);
    expect(importResponse.body.environment).toBeDefined();
    expect(importResponse.body.environment.assetAdministrationShells).toHaveLength(1);
    expect(importResponse.body.environment.submodels).toHaveLength(2);
  });

  it("/POST import template with invalid data returns 400", async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();

    const response = await request(app.getHttpServer())
      .post(`${basePath}/import`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
      .send({ invalid: "data" });

    expect(response.status).toEqual(400);
  });

  it("/POST import and /GET export empty template round-trip", async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();

    const emptyPayload = buildEmptyExportPayload();

    const importResponse = await request(app.getHttpServer())
      .post(`${basePath}/import`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
      .send(emptyPayload);

    expect(importResponse.status).toEqual(201);
    expect(importResponse.body.id).toBeDefined();
    expect(importResponse.body.organizationId).toEqual(org.id);
    expect(importResponse.body.environment.assetAdministrationShells).toHaveLength(1);
    expect(importResponse.body.environment.submodels).toHaveLength(0);
    expect(importResponse.body.environment.conceptDescriptions).toHaveLength(0);

    const exportResponse = await request(app.getHttpServer())
      .get(`${basePath}/${importResponse.body.id}/export`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id);

    expect(exportResponse.status).toEqual(200);
    expect(exportResponse.body.format).toEqual("open-dpp:json");
    expect(exportResponse.body.version).toEqual(AasExportVersion.v3_0);
    expect(exportResponse.body.environment.assetAdministrationShells).toHaveLength(1);
    expect(exportResponse.body.environment.submodels).toHaveLength(0);
    expect(exportResponse.body.environment.conceptDescriptions).toHaveLength(0);
  });

  it("/PUT template status", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();

    const { dppIdentifiableRepository } = ctx.getRepositories();

    const template = Template.create({
      organizationId: org!.id,
      environment: Environment.create({}),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await dppIdentifiableRepository.save(template);

    const response = await request(app.getHttpServer())
      .put(`${basePath}/${template.id}/status`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org!.id)
      .send({
        method: DigitalProductDocumentStatusModificationMethodDto.Publish,
      });
    expect(response.status).toEqual(200);
    const foundPassport = await dppIdentifiableRepository.findOneOrFail(template.id);
    expect(foundPassport.isPublished()).toBeTruthy();
  });

  it("/DELETE template", async () => {
    const { app, getOrganizationAndUserWithCookie } = ctx.globals();
    const { org, userCookie } = await getOrganizationAndUserWithCookie();

    const aas = AssetAdministrationShell.create({});
    const submodel = Submodel.create({ idShort: "testSubmodel" });
    aas.addSubmodel(submodel);
    const { aasRepository, dppIdentifiableRepository, submodelRepository } = ctx.getRepositories();
    await aasRepository.save(aas);
    await submodelRepository.save(submodel);

    const template = Template.create({
      organizationId: org!.id,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: [submodel.id],
        conceptDescriptions: [],
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await dppIdentifiableRepository.save(template);

    const response = await request(app.getHttpServer())
      .delete(`${basePath}/${template.id}`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org!.id);

    expect(response.status).toEqual(204);
    expect(await aasRepository.findOne(aas.id)).toBeUndefined();
    expect(await submodelRepository.findOne(submodel.id)).toBeUndefined();
    expect(await dppIdentifiableRepository.findOne(template.id)).toBeUndefined();

    const publishedTemplate = Template.create({
      organizationId: org!.id,
      environment: Environment.create({}),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastStatusChange: DigitalProductDocumentStatusChange.create({
        currentStatus: DigitalProductDocumentStatus.Published,
      }),
    });

    await dppIdentifiableRepository.save(publishedTemplate);

    const responseForPublishedTemplate = await request(app.getHttpServer())
      .delete(`${basePath}/${publishedTemplate.id}`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org!.id);

    expect(responseForPublishedTemplate.status).toEqual(403);
    expect(responseForPublishedTemplate.body.message).toEqual(
      'Only templates with the status "Draft" can be deleted',
    );
  });

  it("/POST import and /GET export template with all submodel element types", async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();

    const richPayload = buildRichExportPayload();

    const importResponse = await request(app.getHttpServer())
      .post(`${basePath}/import`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
      .send(richPayload);

    expect(importResponse.status).toEqual(201);
    expect(importResponse.body.id).toBeDefined();
    expect(importResponse.body.organizationId).toEqual(org.id);
    expect(importResponse.body.environment.assetAdministrationShells).toHaveLength(1);
    expect(importResponse.body.environment.submodels).toHaveLength(1);
    expect(importResponse.body.environment.conceptDescriptions).toHaveLength(1);

    const exportResponse = await request(app.getHttpServer())
      .get(`${basePath}/${importResponse.body.id}/export`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id);

    expect(exportResponse.status).toEqual(200);

    const exportedSubmodel = exportResponse.body.environment.submodels[0];
    expect(exportedSubmodel.submodelElements).toHaveLength(12);

    const elementTypes = exportedSubmodel.submodelElements.map((e: any) => e.modelType).sort();
    expect(elementTypes).toEqual([
      "AnnotatedRelationshipElement",
      "Blob",
      "Entity",
      "File",
      "MultiLanguageProperty",
      "Property",
      "Property",
      "Range",
      "ReferenceElement",
      "RelationshipElement",
      "SubmodelElementCollection",
      "SubmodelElementList",
    ]);

    // Verify property values are preserved
    const stringProp = exportedSubmodel.submodelElements.find(
      (e: any) => e.idShort === "stringProp",
    );
    expect(stringProp.value).toEqual("hello");
    expect(stringProp.valueType).toEqual("String");

    const intProp = exportedSubmodel.submodelElements.find((e: any) => e.idShort === "intProp");
    expect(intProp.value).toEqual("42");
    expect(intProp.valueType).toEqual("Int");

    // Verify range values are preserved
    const rangeElement = exportedSubmodel.submodelElements.find(
      (e: any) => e.idShort === "rangeElement",
    );
    expect(rangeElement.min).toEqual("0.0");
    expect(rangeElement.max).toEqual("100.0");
    expect(rangeElement.valueType).toEqual("Double");

    // Verify multi-language property values are preserved
    const mlProp = exportedSubmodel.submodelElements.find((e: any) => e.idShort === "mlProp");
    expect(mlProp.value).toEqual([
      { language: "en", text: "English" },
      { language: "de", text: "Deutsch" },
    ]);

    // Verify blob value is preserved
    const blobElement = exportedSubmodel.submodelElements.find(
      (e: any) => e.idShort === "blobElement",
    );
    expect(blobElement.contentType).toEqual("application/octet-stream");
    expect(blobElement.value).toEqual("SGVsbG8=");

    // Verify nested structures are preserved
    const collection = exportedSubmodel.submodelElements.find(
      (e: any) => e.idShort === "collection",
    );
    expect(collection.value).toHaveLength(1);
    expect(collection.value[0].modelType).toEqual("Property");
    expect(collection.value[0].idShort).toEqual("nestedProp");

    const list = exportedSubmodel.submodelElements.find((e: any) => e.idShort === "list");
    expect(list.value).toHaveLength(2);
    expect(list.value[0].idShort).toEqual("listItem1");
    expect(list.value[1].idShort).toEqual("listItem2");

    const entity = exportedSubmodel.submodelElements.find(
      (e: any) => e.idShort === "entityElement",
    );
    expect(entity.statements).toHaveLength(1);
    expect(entity.entityType).toEqual("SelfManagedEntity");

    const annotatedRel = exportedSubmodel.submodelElements.find(
      (e: any) => e.idShort === "annotatedRelElement",
    );
    expect(annotatedRel.annotations).toHaveLength(1);
    expect(annotatedRel.annotations[0].modelType).toEqual("Property");
    expect(annotatedRel.annotations[0].idShort).toEqual("annotProp");
    expect(annotatedRel.annotations[0].value).toEqual("annotation-value");
    expect(annotatedRel.first).toBeDefined();
    expect(annotatedRel.second).toBeDefined();

    // Verify concept descriptions are preserved after import/export round-trip
    const exportedConceptDescriptions = exportResponse.body.environment.conceptDescriptions;
    expect(exportedConceptDescriptions).toHaveLength(1);
    expect(exportedConceptDescriptions[0].idShort).toEqual("conceptDesc1");
    expect(exportedConceptDescriptions[0].displayName).toEqual([
      { language: "en", text: "Test Concept" },
    ]);
    expect(exportedConceptDescriptions[0].isCaseOf).toHaveLength(1);
  });
});
