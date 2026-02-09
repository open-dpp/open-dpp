import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import request from "supertest";
import { Environment } from "../../aas/domain/environment";
import { createAasTestContext } from "../../aas/presentation/aas.test.context";
import { DateTime } from "../../lib/date-time";
import { Template } from "../../templates/domain/template";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../../templates/infrastructure/template.schema";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import {
  UniqueProductIdentifierService,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { Passport } from "../domain/passport";
import { PassportRepository } from "../infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../infrastructure/passport.schema";
import { PassportsModule } from "../passports.module";
import { PassportController } from "./passport.controller";

describe("passportController", () => {
  const basePath = "/passports";
  const ctx = createAasTestContext(basePath, {
    imports: [PassportsModule],
    providers: [PassportRepository, TemplateRepository, UniqueProductIdentifierService],
    controllers: [PassportController],
  }, [
    {
      name: PassportDoc.name,
      schema: PassportSchema,
    },
    {
      name: TemplateDoc.name,
      schema: TemplateSchema,
    },
    {
      name: UniqueProductIdentifierDoc.name,
      schema: UniqueProductIdentifierSchema,
    },
  ], PassportRepository);

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

  it(`/GET List all passports`, async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { aas, submodels } = ctx.getAasObjects();

    const firstCreate = new Date(
      "2022-01-01T00:00:00.000Z",
    );

    const firstId = randomUUID();

    const secondCreate = new Date(
      "2023-05-01T00:00:00.000Z",
    );

    const secondId = randomUUID();

    const passportRepository = ctx.getModuleRef().get(PassportRepository);

    const firstPassport = Passport.create({
      id: firstId,
      organizationId: org.id,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map(s => s.id),
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
        submodels: submodels.map(s => s.id),
        conceptDescriptions: [],
      }),
      createdAt: secondCreate,
      updatedAt: secondCreate,
    });

    await passportRepository.save(firstPassport);
    await passportRepository.save(secondPassport);

    const response = await request(app.getHttpServer())
      .get(basePath)
      .set("Cookie", userCookie)
      .send();

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      paging_metadata: {
        cursor: expect.any(String),
      },
      result: [secondPassport, firstPassport].map(p => ({
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

    const createDate = new Date(
      "2022-01-01T00:00:00.000Z",
    );

    const id = randomUUID();

    const passportRepository = ctx.getModuleRef().get(PassportRepository);

    const passport = Passport.create({
      id,
      organizationId: org.id,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map(s => s.id),
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
    const now = new Date(
      "2022-01-01T00:00:00.000Z",
    );
    jest.spyOn(DateTime, "now").mockReturnValue(now);
    const response = await request(app.getHttpServer())
      .post(basePath)
      .set("Cookie", userCookie)
      .send();

    expect(response.status).toEqual(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      organizationId: org.id,
      templateId: null,
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
        submodels: submodels.map(s => s.id),
        conceptDescriptions: [],
      }),
      createdAt: templateCreation,
      updatedAt: templateCreation,
    });

    await templateRepository.save(template);

    const response = await request(app.getHttpServer())
      .post(basePath)
      .set("Cookie", userCookie)
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

    expect(response.body.environment.assetAdministrationShells).toHaveLength(template.environment.assetAdministrationShells.length);
    expect(response.body.environment.submodels).toHaveLength(template.environment.submodels.length);

    const upidService = ctx.getModuleRef().get(UniqueProductIdentifierService);

    const upids = await upidService.findAllByReferencedId(response.body.id);
    expect(upids).toHaveLength(1);
  });

  it(`/GET shells`, async () => {
    await ctx.asserts.getShells(createPassport);
  });

  it(`/GET submodels`, async () => {
    await ctx.asserts.getSubmodels(createPassport);
  });

  it(`/POST submodel`, async () => {
    await ctx.asserts.postSubmodel(createPassport);
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
});
