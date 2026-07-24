import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { ApiVersionsDto } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import {
  ForbiddenExceptionFilter,
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
} from "@open-dpp/exception";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { SubmodelRequest } from "../../aas/presentation/requests/submodel.request";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AuthModule } from "../../identity/auth/auth.module";
import { AUTH } from "../../identity/auth/auth.provider";
import { AuthGuard } from "../../identity/auth/infrastructure/guards/auth.guard";
import { ORGANIZATION_ID_HEADER } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { UsersService } from "../../identity/users/application/services/users.service";
import { UsersModule } from "../../identity/users/users.module";
import { Template } from "../../templates/domain/template";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import { BulkImportModule } from "../bulk-import.module";
import { OrganizationsModule } from "../../identity/organizations/organizations.module";

describe("BulkImport controllers", () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  const betterAuthHelper = new BetterAuthHelper();
  let templateRepository: TemplateRepository;
  let environmentService: EnvironmentService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        AuthModule,
        UsersModule,
        OrganizationsModule,
        BulkImportModule,
      ],
      providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
    })
      .overrideProvider(EmailService)
      .useValue({ send: jest.fn() })
      .compile();

    betterAuthHelper.init(moduleRef.get<UsersService>(UsersService), moduleRef.get<Auth>(AUTH));
    templateRepository = moduleRef.get<TemplateRepository>(TemplateRepository);
    environmentService = moduleRef.get<EnvironmentService>(EnvironmentService);

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(
      new NotFoundInDatabaseExceptionFilter(),
      new NotFoundExceptionFilter(),
      new ForbiddenExceptionFilter(),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  async function createTemplate(organizationId: string): Promise<Template> {
    const environment = await environmentService.createEnvironment(
      { assetAdministrationShells: [{}] },
      true,
    );
    const template = Template.create({ organizationId, environment });
    return await templateRepository.save(template);
  }

  /**
   * Adds a real "Nameplate" submodel (with a "sku" Property) to the template, so a bulk import
   * run against it exercises the real idShort -> id resolution against the passport's own (copied)
   * environment - not just a submodelId round-tripped through the config CRUD endpoints.
   */
  async function addNameplateSubmodel(template: Template): Promise<void> {
    await environmentService.addSubmodelToEnvironment(
      randomUUID(),
      template.id,
      template.environment,
      SubmodelRequest.create({
        body: {
          id: randomUUID(),
          idShort: "Nameplate",
          submodelElements: [{ idShort: "sku", modelType: "Property", valueType: "String" }],
        },
        version: ApiVersionsDto.v2,
      }),
      (options) => templateRepository.save(template, options).then(() => undefined),
      { subject: SubjectAttributes.create({ userRole: UserRole.ADMIN }), userId: randomUUID() },
    );
  }

  const submodelFieldMapping = () => ({
    submodelIdShort: "Nameplate",
    fieldMappings: [{ input: "sku", output: "sku" }],
  });

  async function waitForRunCompletion(
    runId: string,
    userCookie: string,
    organizationId: string,
  ): Promise<{ status: string }> {
    for (let attempt = 0; attempt < 40; attempt++) {
      const response = await request(app.getHttpServer())
        .get(`/bulk-import/runs/${runId}`)
        .set("Cookie", userCookie)
        .set(ORGANIZATION_ID_HEADER, organizationId);
      if (response.body.status !== "pending" && response.body.status !== "running") {
        return response.body;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error(`Run ${runId} did not complete in time`);
  }

  it("creates, reads, updates and deletes a bulk import config", async () => {
    const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const template = await createTemplate(org.id);

    const createResponse = await request(app.getHttpServer())
      .post("/bulk-import/configs")
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id)
      .send({
        templateId: template.id,
        name: "ERP export",
        idField: "sku",
        submodelMappings: [submodelFieldMapping()],
      });

    expect(createResponse.status).toEqual(201);
    expect(createResponse.body).toMatchObject({
      organizationId: org.id,
      templateId: template.id,
      name: "ERP export",
      idField: "sku",
    });
    const configId = createResponse.body.id;

    const getResponse = await request(app.getHttpServer())
      .get(`/bulk-import/configs/${configId}`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id);
    expect(getResponse.status).toEqual(200);
    expect(getResponse.body.id).toEqual(configId);

    const listResponse = await request(app.getHttpServer())
      .get(`/bulk-import/configs?templateId=${template.id}`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id);
    expect(listResponse.status).toEqual(200);
    expect(listResponse.body.result.map((c: { id: string }) => c.id)).toEqual([configId]);

    const updateResponse = await request(app.getHttpServer())
      .put(`/bulk-import/configs/${configId}`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id)
      .send({ name: "Renamed export", idField: "sku", submodelMappings: [submodelFieldMapping()] });
    expect(updateResponse.status).toEqual(200);
    expect(updateResponse.body.name).toEqual("Renamed export");

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/bulk-import/configs/${configId}`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id);
    expect(deleteResponse.status).toEqual(204);

    const getAfterDeleteResponse = await request(app.getHttpServer())
      .get(`/bulk-import/configs/${configId}`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id);
    expect(getAfterDeleteResponse.status).toEqual(404);
  });

  it("rejects creating a config against a template from another organization", async () => {
    const { org: templateOrg } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const template = await createTemplate(templateOrg.id);
    const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();

    const response = await request(app.getHttpServer())
      .post("/bulk-import/configs")
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id)
      .send({
        templateId: template.id,
        name: "ERP export",
        idField: "sku",
        submodelMappings: [submodelFieldMapping()],
      });

    expect(response.status).toEqual(403);
  });

  it("rejects reading a config that belongs to another organization", async () => {
    const { org: ownerOrg, userCookie: ownerCookie } =
      await betterAuthHelper.createOrganizationAndUserWithCookie();
    const template = await createTemplate(ownerOrg.id);
    const createResponse = await request(app.getHttpServer())
      .post("/bulk-import/configs")
      .set("Cookie", ownerCookie)
      .set(ORGANIZATION_ID_HEADER, ownerOrg.id)
      .send({
        templateId: template.id,
        name: "ERP export",
        idField: "sku",
        submodelMappings: [submodelFieldMapping()],
      });
    const configId = createResponse.body.id;

    const { org: otherOrg, userCookie: otherCookie } =
      await betterAuthHelper.createOrganizationAndUserWithCookie();

    const response = await request(app.getHttpServer())
      .get(`/bulk-import/configs/${configId}`)
      .set("Cookie", otherCookie)
      .set(ORGANIZATION_ID_HEADER, otherOrg.id);

    expect(response.status).toEqual(403);
  });

  it("triggers a run and exposes its status, run history and per-row items", async () => {
    const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const template = await createTemplate(org.id);
    await addNameplateSubmodel(template);

    const configResponse = await request(app.getHttpServer())
      .post("/bulk-import/configs")
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id)
      .send({
        templateId: template.id,
        name: "ERP export",
        idField: "sku",
        submodelMappings: [submodelFieldMapping()],
      });
    const configId = configResponse.body.id;

    const runResponse = await request(app.getHttpServer())
      .post(`/bulk-import/configs/${configId}/runs`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id)
      .send({ rows: [{ sku: "4711" }, { sku: "4712" }] });

    expect(runResponse.status).toEqual(201);
    expect(runResponse.body).toMatchObject({
      bulkImportConfigId: configId,
      organizationId: org.id,
      status: "pending",
      totalCount: 2,
    });
    const runId = runResponse.body.id;

    const runsForConfigResponse = await request(app.getHttpServer())
      .get(`/bulk-import/configs/${configId}/runs`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id);
    expect(runsForConfigResponse.status).toEqual(200);
    expect(runsForConfigResponse.body.result.map((r: { id: string }) => r.id)).toEqual([runId]);

    const completedRun = await waitForRunCompletion(runId, userCookie, org.id);
    // Proves the row was actually applied to the created passport, not just that the run
    // finished - the passport's submodel ids differ from the template's (copied, not shared), so
    // this only passes if the config's idShort-based mapping resolved correctly against the
    // passport's own environment.
    expect(completedRun.status).toEqual("completed");

    const itemsResponse = await request(app.getHttpServer())
      .get(`/bulk-import/runs/${runId}/items`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id);
    expect(itemsResponse.status).toEqual(200);
    expect(itemsResponse.body.result).toHaveLength(2);
    expect(itemsResponse.body.result.map((i: { rowIndex: number }) => i.rowIndex).sort()).toEqual([
      0, 1,
    ]);
    for (const item of itemsResponse.body.result as { status: string; error?: string }[]) {
      expect(item.error).toBeFalsy();
      expect(item.status).toEqual("created");
    }

    const firstItem = itemsResponse.body.result.find(
      (i: { rowIndex: number }) => i.rowIndex === 0,
    ) as { passportId: string };
    const passportSubmodelsResponse = await request(app.getHttpServer())
      .get(`/passports/${firstItem.passportId}/submodels`)
      .set("Cookie", userCookie)
      .set(ORGANIZATION_ID_HEADER, org.id);
    expect(passportSubmodelsResponse.status).toEqual(200);
    const nameplate = passportSubmodelsResponse.body.result.find(
      (s: { idShort: string }) => s.idShort === "Nameplate",
    );
    const skuProperty = nameplate.submodelElements.find(
      (e: { idShort: string }) => e.idShort === "sku",
    );
    expect(skuProperty.value).toEqual("4711");
  });

  it("rejects reading a run that belongs to another organization", async () => {
    const { org: ownerOrg, userCookie: ownerCookie } =
      await betterAuthHelper.createOrganizationAndUserWithCookie();
    const template = await createTemplate(ownerOrg.id);
    const configResponse = await request(app.getHttpServer())
      .post("/bulk-import/configs")
      .set("Cookie", ownerCookie)
      .set(ORGANIZATION_ID_HEADER, ownerOrg.id)
      .send({
        templateId: template.id,
        name: "ERP export",
        idField: "sku",
        submodelMappings: [submodelFieldMapping()],
      });
    const runResponse = await request(app.getHttpServer())
      .post(`/bulk-import/configs/${configResponse.body.id}/runs`)
      .set("Cookie", ownerCookie)
      .set(ORGANIZATION_ID_HEADER, ownerOrg.id)
      .send({ rows: [{ sku: "4711" }] });
    const runId = runResponse.body.id;

    const { org: otherOrg, userCookie: otherCookie } =
      await betterAuthHelper.createOrganizationAndUserWithCookie();

    const response = await request(app.getHttpServer())
      .get(`/bulk-import/runs/${runId}`)
      .set("Cookie", otherCookie)
      .set(ORGANIZATION_ID_HEADER, otherOrg.id);

    expect(response.status).toEqual(403);
  });
});
