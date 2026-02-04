import type { TemplateDbProps } from "../../old-templates/domain/template";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { EnvService } from "@open-dpp/env";
import request from "supertest";
import { Environment } from "../../aas/domain/environment";
import { createAasTestContext } from "../../aas/presentation/aas.test.context";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { Item } from "../../items/domain/item";
import { ItemDoc, ItemSchema } from "../../items/infrastructure/item.schema";
import { ItemsService } from "../../items/infrastructure/items.service";
import { Model } from "../../models/domain/model";
import { ModelDoc, ModelSchema } from "../../models/infrastructure/model.schema";
import { ModelsService } from "../../models/infrastructure/models.service";
import { Template } from "../../old-templates/domain/template";
import { OldTemplateDoc, TemplateSchema } from "../../old-templates/infrastructure/template.schema";
import { TemplateService } from "../../old-templates/infrastructure/template.service";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PassportSchema } from "../../passports/infrastructure/passport.schema";
import { PassportDoc } from "../../product-passport-data/infrastructure/product-passport-data.schema";
import { phoneFactory } from "../../product-passport/fixtures/product-passport.factory";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../infrastructure/unique-product-identifier.schema";
import { UniqueProductIdentifierService } from "../infrastructure/unique-product-identifier.service";
import { UniqueProductIdentifierModule } from "../unique.product.identifier.module";
import { UniqueProductIdentifierApplicationService } from "./unique.product.identifier.application.service";
import { UniqueProductIdentifierController } from "./unique.product.identifier.controller";

describe("uniqueProductIdentifierController", () => {
  const basePath = "/unique-product-identifier";
  const ctx = createAasTestContext(basePath, {
    imports: [UniqueProductIdentifierModule],
    providers: [
      UniqueProductIdentifierService,
      PassportRepository,
      ModelsService,
      UniqueProductIdentifierService,
      UniqueProductIdentifierApplicationService,
      ItemsService,
      TemplateService,
    ],
    controllers: [UniqueProductIdentifierController],
  }, [
    {
      name: PassportDoc.name,
      schema: PassportSchema,
    },
    {
      name: UniqueProductIdentifierDoc.name,
      schema: UniqueProductIdentifierSchema,
    },
    {
      name: ModelDoc.name,
      schema: ModelSchema,
    },
    {
      name: ItemDoc.name,
      schema: ItemSchema,
    },
    {
      name: OldTemplateDoc.name,
      schema: TemplateSchema,
    },
  ], UniqueProductIdentifierService);

  async function createPassportWithUniqueProductIdentifier(orgId: string): Promise<Passport> {
    const { aas, submodels } = ctx.getAasObjects();

    const passport = Passport.create({
      id: randomUUID(),
      organizationId: orgId,
      environment: Environment.create({
        assetAdministrationShells: [aas.id],
        submodels: submodels.map(s => s.id),
        conceptDescriptions: [],
      }),
    });

    const upid = passport.createUniqueProductIdentifier();

    ctx.getRepositories().dppIdentifiableRepository.save(upid);

    return ctx.getModuleRef().get(PassportRepository).save(passport);
  }

  it(`/GET reference of unique product identifier`, async () => {
    const { org, user, userCookie } = await ctx.globals().betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const phoneTemplate: TemplateDbProps = phoneFactory
      .addSections()
      .build({
        userId: user.id,
        organizationId: org.id,
      });
    const template = Template.loadFromDb({ ...phoneTemplate });
    await ctx.getModuleRef().get(TemplateService).save(template);
    const model = Model.create({
      name: "model",
      userId: randomUUID(),
      organizationId: randomUUID(),
      template,
    });
    const item = Item.create({
      organizationId: org.id,
      userId: user.id,
      template,
      model,
    });
    const { uuid } = item.createUniqueProductIdentifier("externalId");
    await ctx.getModuleRef().get(ItemsService).save(item);

    const response = await request(ctx.globals().app.getHttpServer())
      .get(
        `/organizations/${org.id}/unique-product-identifiers/${uuid}/reference`,
      )
      .set("Cookie", userCookie);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: item.id,
      organizationId: org.id,
      modelId: model.id,
      granularityLevel: GranularityLevel.ITEM,
    });
  });

  it(`/GET organizationId of unique product identifier`, async () => {
    const { org, user } = await ctx.globals().betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const phoneTemplate: TemplateDbProps = phoneFactory
      .addSections()
      .build({
        userId: user.id,
        organizationId: org.id,
      });

    const template = Template.loadFromDb({ ...phoneTemplate });
    const templateService = ctx.getModuleRef().get(TemplateService);
    await templateService.save(template);
    const model = Model.create({
      name: "model",
      userId: user.id,
      organizationId: org.id,
      template,
    });
    const modelsService = ctx.getModuleRef().get(ModelsService);
    await modelsService.save(model);
    const item = Item.create({
      organizationId: org.id,
      userId: user.id,
      template,
      model,
    });
    const { uuid } = item.createUniqueProductIdentifier("externalId");
    const itemsService = ctx.getModuleRef().get(ItemsService);
    const configService = ctx.getModuleRef().get(EnvService);
    await itemsService.save(item);

    const response = await request(ctx.globals().app.getHttpServer())
      .get(`/unique-product-identifiers/${uuid}/metadata`)
      .set("service_token", configService.get("OPEN_DPP_SERVICE_TOKEN"));

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      modelId: model.id,
      organizationId: org.id,
      passportId: item.id,
      templateId: template.id,
    });
  });

  it(`/GET fails to return organizationId of unique product identifier if service token invalid`, async () => {
    const response = await request(ctx.globals().app.getHttpServer())
      .get(`/unique-product-identifiers/${randomUUID()}/metadata`)
      .set("service_token", "invalid_token");
    expect(response.status).toEqual(403);
  });

  it(`/GET model reference of unique product identifier`, async () => {
    const { org, user, userCookie } = await ctx.globals().betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const phoneTemplate: TemplateDbProps = phoneFactory
      .addSections()
      .build({
        userId: user.id,
        organizationId: org.id,
      });
    const template = Template.loadFromDb({ ...phoneTemplate });
    const templateService = ctx.getModuleRef().get(TemplateService);
    await templateService.save(template);
    const model = Model.create({
      name: "model",
      userId: randomUUID(),
      organizationId: org.id,
      template,
    });
    const { uuid } = model.createUniqueProductIdentifier();
    const modelsService = ctx.getModuleRef().get(ModelsService);
    await modelsService.save(model);
    const response = await request(ctx.globals().app.getHttpServer())
      .get(
        `/organizations/${org.id}/unique-product-identifiers/${uuid}/reference`,
      )
      .set("Cookie", userCookie);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: model.id,
      organizationId: org.id,
      granularityLevel: GranularityLevel.MODEL,
    });
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
