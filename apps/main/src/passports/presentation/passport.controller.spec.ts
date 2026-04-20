import { randomUUID } from "node:crypto";
import { afterAll, jest } from "@jest/globals";
import request from "supertest";
import {
  buildEmptyExportPayload,
  buildRichExportPayload,
} from "../../../test/export-payload.fixtures";
import { AasModule } from "../../aas/aas.module";
import { LanguageText } from "../../aas/domain/common/language-text";
import { Environment } from "../../aas/domain/environment";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { AasRepository } from "../../aas/infrastructure/aas.repository";
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
import { PresentationReferenceType } from "@open-dpp/dto";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { PresentationConfigurationsModule } from "../../presentation-configurations/presentation-configurations.module";
import { Template } from "../../templates/domain/template";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../../templates/infrastructure/template.schema";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { Passport } from "../domain/passport";
import { PassportRepository } from "../infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../infrastructure/passport.schema";
import { PassportsModule } from "../passports.module";
import { PassportController } from "./passport.controller";

describe("passportController", () => {
  const basePath = "/passports";
  const ctx = createAasTestContext(
    basePath,
    {
      imports: [PassportsModule, AasModule, PresentationConfigurationsModule],
      providers: [
        PassportRepository,
        TemplateRepository,
        UniqueProductIdentifierService,
        AasSerializationService,
      ],
      controllers: [PassportController],
    },
    [
      { name: PassportDoc.name, schema: PassportSchema },
      {
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
      { name: UniqueProductIdentifierDoc.name, schema: UniqueProductIdentifierSchema },
      { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
    ],
    PassportRepository,
    SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.OWNER }),
  );

  async function createPassport(orgId?: string): Promise<Passport> {
    const { aas, submodels } = ctx.getAasObjects();
    return ctx.getRepositories().dppIdentifiableRepository.save(
      Passport.create({
        id: randomUUID(),
        organizationId: orgId ?? randomUUID(),
        environment: Environment.create({
          assetAdministrationShells: [aas.id],
          submodels: submodels.map((s) => s.id),
          conceptDescriptions: [],
        }),
      }),
    );
  }

  async function savePassport(passport: Passport): Promise<Template> {
    return ctx.getRepositories().dppIdentifiableRepository.save(passport);
  }

  it(`/GET List all passports`, async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { aas, submodels } = ctx.getAasObjects();

    const firstCreate = new Date("2022-01-01T00:00:00.000Z");

    const firstId = randomUUID();

    const secondCreate = new Date("2023-05-01T00:00:00.000Z");

    const secondId = randomUUID();

    const passportRepository = ctx.getModuleRef().get(PassportRepository);

    const firstPassport = Passport.create({
      id: firstId,
      organizationId: org.id,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map((s) => s.id),
        conceptDescriptions: [],
      }),
      createdAt: firstCreate,
      updatedAt: firstCreate,
    });

    const secondPassport = Passport.create({
      id: secondId,
      organizationId: org.id,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map((s) => s.id),
        conceptDescriptions: [],
      }),
      createdAt: secondCreate,
      updatedAt: secondCreate,
    });

    await passportRepository.save(firstPassport);
    await passportRepository.save(secondPassport);

    let response = await request(app.getHttpServer())
      .get(`${basePath}?populate=environment.assetAdministrationShells`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
      .send();

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      paging_metadata: {
        cursor: expect.any(String),
      },
      result: [secondPassport, firstPassport].map((p) => ({
        ...p.toPlain(),
        environment: {
          ...p.environment.toPlain(),
          assetAdministrationShells: [
            {
              id: aas.id,
              displayName: aas.displayName.map((d) => ({ language: d.language, text: d.text })),
            },
          ],
        },
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });

    response = await request(app.getHttpServer())
      .get(`${basePath}`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      paging_metadata: {
        cursor: expect.any(String),
      },
      result: [secondPassport, firstPassport].map((p) => ({
        ...p.toPlain(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  });

  it(`/GET Get passport by id`, async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { aas, submodels } = ctx.getAasObjects();

    const createDate = new Date("2022-01-01T00:00:00.000Z");

    const id = randomUUID();

    const passportRepository = ctx.getModuleRef().get(PassportRepository);

    const passport = Passport.create({
      id,
      organizationId: org.id,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map((s) => s.id),
        conceptDescriptions: [],
      }),
      createdAt: createDate,
      updatedAt: createDate,
    });

    await passportRepository.save(passport);

    const response = await request(app.getHttpServer())
      .get(`${basePath}/${passport.id}`)
      .set("Cookie", userCookie)
      .send();

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      ...passport.toPlain(),
      createdAt: passport.createdAt.toISOString(),
      updatedAt: passport.updatedAt.toISOString(),
    });
  });

  it(`/POST Create blank passport`, async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const now = new Date("2022-01-01T00:00:00.000Z");
    jest.spyOn(DateTime, "now").mockReturnValue(now);
    const displayName = [{ language: "en", text: "Test passport" }];
    const body = {
      environment: {
        assetAdministrationShells: [{ displayName }],
      },
    };

    const response = await request(app.getHttpServer())
      .post(basePath)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
      .send(body);
    expect(response.status).toEqual(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      organizationId: org.id,
      templateId: null,
      environment: {
        assetAdministrationShells: [expect.any(String)],
        submodels: [],
        conceptDescriptions: [],
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    const aasRepository = ctx.getModuleRef().get(AasRepository);
    const aas = await aasRepository.findOneOrFail(
      response.body.environment.assetAdministrationShells[0],
    );
    expect(aas.displayName).toEqual(displayName.map(LanguageText.fromPlain));

    const upidService = ctx.getModuleRef().get(UniqueProductIdentifierService);

    const upids = await upidService.findAllByReferencedId(response.body.id);
    expect(upids).toHaveLength(1);
  });

  it(`/POST Create passport from template`, async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const now = new Date("2022-01-01T00:00:00.000Z");
    const templateCreation = new Date("2020-01-01T00:00:00.000Z");

    jest.spyOn(DateTime, "now").mockReturnValue(now);

    const templateRepository = ctx.getModuleRef().get(TemplateRepository);
    const templateId = randomUUID().toString();

    const { aas, submodels } = ctx.getAasObjects();
    const template = Template.create({
      id: templateId,
      organizationId: org.id,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map((s) => s.id),
        conceptDescriptions: [],
      }),
      createdAt: templateCreation,
      updatedAt: templateCreation,
    });

    await templateRepository.save(template);

    const response = await request(app.getHttpServer())
      .post(basePath)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
      .send({
        templateId,
      });

    expect(response.status).toEqual(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      organizationId: org.id,
      templateId,
      environment: {
        assetAdministrationShells: expect.any(Array),
        submodels: expect.any(Array),
        conceptDescriptions: [],
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    expect(response.body.environment.assetAdministrationShells).toHaveLength(
      template.environment.assetAdministrationShells.length,
    );
    expect(response.body.environment.submodels).toHaveLength(template.environment.submodels.length);

    const upidService = ctx.getModuleRef().get(UniqueProductIdentifierService);

    const upids = await upidService.findAllByReferencedId(response.body.id);
    expect(upids).toHaveLength(1);
  });

  it(`/GET shells`, async () => {
    await ctx.asserts.getShells(createPassport);
  });

  it(`/GET shells lazily materializes a PresentationConfiguration for the passport`, async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const passport = await createPassport(org.id);
    const presentationConfigurationRepository = ctx
      .getModuleRef()
      .get(PresentationConfigurationRepository);

    expect(
      await presentationConfigurationRepository.findByReference({
        referenceType: PresentationReferenceType.Passport,
        referenceId: passport.id,
      }),
    ).toBeUndefined();

    const firstResponse = await request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/shells?limit=1`)
      .set("Cookie", userCookie)
      .set("x-open-dpp-organization-id", org.id)
      .send();
    expect(firstResponse.status).toEqual(200);

    const created = await presentationConfigurationRepository.findByReference({
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
    });
    expect(created).toBeDefined();
    expect(created!.organizationId).toBe(org.id);

    const secondResponse = await request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/shells?limit=1`)
      .set("Cookie", userCookie)
      .set("x-open-dpp-organization-id", org.id)
      .send();
    expect(secondResponse.status).toEqual(200);

    const reused = await presentationConfigurationRepository.findByReference({
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
    });
    expect(reused!.id).toBe(created!.id);
  });

  it(`/PATCH shell`, async () => {
    await ctx.asserts.modifyShell(createPassport, savePassport);
  });

  it(`/GET submodels`, async () => {
    await ctx.asserts.getSubmodels(createPassport);
  });

  it(`/POST submodel`, async () => {
    await ctx.asserts.postSubmodel(createPassport);
  });
  it("/DELETE policy", async () => {
    await ctx.asserts.deletePolicy(createPassport);
  });

  it("/DELETE submodel", async () => {
    await ctx.asserts.deleteSubmodel(createPassport, savePassport);
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

  it(`/DELETE submodel element`, async () => {
    await ctx.asserts.deleteSubmodelElement(createPassport, savePassport);
  });

  it(`/PATCH submodel element`, async () => {
    await ctx.asserts.modifySubmodelElement(createPassport, savePassport);
  });

  it(`/PATCH submodel element value`, async () => {
    await ctx.asserts.modifySubmodelElementValue(createPassport, savePassport);
  });

  it("/POST add column", async () => {
    await ctx.asserts.addColumn(createPassport, savePassport);
  });

  it("/PATCH modify column", async () => {
    await ctx.asserts.modifyColumn(createPassport, savePassport);
  });

  it("/DELETE column", async () => {
    await ctx.asserts.deleteColumn(createPassport, savePassport);
  });

  it("/POST add row", async () => {
    await ctx.asserts.addRow(createPassport, savePassport);
  });

  it("/DELETE row", async () => {
    await ctx.asserts.deleteRow(createPassport, savePassport);
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

  it("/GET export passport", async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const passport = await createPassport(org.id);

    const response = await request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/export`)
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

  it("/POST import passport", async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const passport = await createPassport(org.id);

    const exportResponse = await request(app.getHttpServer())
      .get(`${basePath}/${passport.id}/export`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id);
    expect(exportResponse.status).toEqual(200);

    const importResponse = await request(app.getHttpServer())
      .post(`${basePath}/import`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
      .send(exportResponse.body);

    expect(importResponse.status).toEqual(201);
    expect(importResponse.body.id).toBeDefined();
    expect(importResponse.body.id).not.toEqual(passport.id);
    expect(importResponse.body.organizationId).toEqual(org.id);
    expect(importResponse.body.templateId).toBeNull();
    expect(importResponse.body.environment).toBeDefined();
    expect(importResponse.body.environment.assetAdministrationShells).toHaveLength(1);
    expect(importResponse.body.environment.submodels).toHaveLength(2);

    const upidService = ctx.getModuleRef().get(UniqueProductIdentifierService);
    const upids = await upidService.findAllByReferencedId(importResponse.body.id);
    expect(upids).toHaveLength(1);
  });

  it("/POST import passport with invalid data returns 400", async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();

    const response = await request(app.getHttpServer())
      .post(`${basePath}/import`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
      .send({ invalid: "data" });

    expect(response.status).toEqual(400);
  });

  it("/POST import and /GET export empty passport round-trip", async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();

    const emptyPayload = buildEmptyExportPayload("Instance");

    const importResponse = await request(app.getHttpServer())
      .post(`${basePath}/import`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
      .send(emptyPayload);

    expect(importResponse.status).toEqual(201);
    expect(importResponse.body.id).toBeDefined();
    expect(importResponse.body.organizationId).toEqual(org.id);
    expect(importResponse.body.templateId).toBeNull();
    expect(importResponse.body.environment.assetAdministrationShells).toHaveLength(1);
    expect(importResponse.body.environment.submodels).toHaveLength(0);
    expect(importResponse.body.environment.conceptDescriptions).toHaveLength(0);

    const upidService = ctx.getModuleRef().get(UniqueProductIdentifierService);
    const upids = await upidService.findAllByReferencedId(importResponse.body.id);
    expect(upids).toHaveLength(1);

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

  it("/POST import and /GET export passport with all submodel element types", async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();

    const richPayload = buildRichExportPayload("Instance");

    const importResponse = await request(app.getHttpServer())
      .post(`${basePath}/import`)
      .set("Cookie", userCookie)
      .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
      .send(richPayload);

    expect(importResponse.status).toEqual(201);
    expect(importResponse.body.id).toBeDefined();
    expect(importResponse.body.organizationId).toEqual(org.id);
    expect(importResponse.body.templateId).toBeNull();
    expect(importResponse.body.environment.assetAdministrationShells).toHaveLength(1);
    expect(importResponse.body.environment.submodels).toHaveLength(1);
    expect(importResponse.body.environment.conceptDescriptions).toHaveLength(1);

    const upidService = ctx.getModuleRef().get(UniqueProductIdentifierService);
    const upids = await upidService.findAllByReferencedId(importResponse.body.id);
    expect(upids).toHaveLength(1);

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

  describe("api key authentication", () => {
    it("/GET List passports with API key", async () => {
      const { betterAuthHelper, app } = ctx.globals();
      const { org, apiKey } = await betterAuthHelper.createOrganizationAndUserWithApiKey();
      const passport = await createPassport(org.id);

      const response = await request(app.getHttpServer())
        .get(basePath)
        .set("x-api-key", apiKey)
        .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.result).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: passport.id })]),
      );
    });

    it("/POST Create passport with API key", async () => {
      const { betterAuthHelper, app } = ctx.globals();
      const { org, apiKey } = await betterAuthHelper.createOrganizationAndUserWithApiKey();

      const now = new Date("2022-01-01T00:00:00.000Z");
      jest.spyOn(DateTime, "now").mockReturnValue(now);

      const displayName = [{ language: "en", text: "API key passport" }];
      const body = {
        environment: {
          assetAdministrationShells: [{ displayName }],
        },
      };

      const response = await request(app.getHttpServer())
        .post(basePath)
        .set("x-api-key", apiKey)
        .set("X-OPEN-DPP-ORGANIZATION-ID", org.id)
        .send(body);

      expect(response.status).toEqual(201);
      expect(response.body.organizationId).toEqual(org.id);
      expect(response.body.id).toBeDefined();
    });

    it("rejects request with invalid API key", async () => {
      const { app } = ctx.globals();

      const response = await request(app.getHttpServer())
        .get(basePath)
        .set("x-api-key", "invalid-key")
        .set("X-OPEN-DPP-ORGANIZATION-ID", randomUUID())
        .send();

      expect(response.status).toEqual(403);
    });

    it("rejects request when API key user is not member of organization", async () => {
      const { betterAuthHelper, app } = ctx.globals();
      const { apiKey } = await betterAuthHelper.createOrganizationAndUserWithApiKey();
      const { org: otherOrg } = await betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(app.getHttpServer())
        .get(basePath)
        .set("x-api-key", apiKey)
        .set("X-OPEN-DPP-ORGANIZATION-ID", otherOrg.id)
        .send();

      expect(response.status).toEqual(403);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
