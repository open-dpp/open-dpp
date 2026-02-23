import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { Environment } from "../../aas/domain/environment";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { AuthService } from "../../auth/auth.service";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../../templates/infrastructure/template.schema";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import {
  UniqueProductIdentifierService,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { UniqueProductIdentifierService } from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { PassportService } from "../application/services/passport.service";
import { Passport } from "../domain/passport";
import { PassportRepository } from "../infrastructure/passport.repository";
import { PassportController } from "./passport.controller";

describe("passportController", () => {
  let controller: PassportController;

  const mockPassportService = {
    exportPassport: jest.fn(),
    importPassport: jest.fn(),
  };
  async function savePassport(passport: Passport): Promise<Template> {
    return ctx.getRepositories().dppIdentifiableRepository.save(passport);
  }

  it(`/GET List all passports`, async () => {
    const { betterAuthHelper, app } = ctx.globals();
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { aas, submodels } = ctx.getAasObjects();

  const mockPassportRepository = {
    findOneOrFail: jest.fn(),
  };

  const mockAuthService = {
    getActiveOrganizationId: jest.fn(),
    checkOwnerShipOfDppIdentifiable: jest.fn(),
    getSession: jest.fn(),
    isMemberOfOrganization: jest.fn(),
  };

  // Mocks for environment helpers

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PassportController],
      providers: [
        { provide: PassportService, useValue: mockPassportService },
        { provide: PassportRepository, useValue: mockPassportRepository },
        { provide: AuthService, useValue: mockAuthService },
        { provide: EnvironmentService, useValue: {} },
        { provide: TemplateRepository, useValue: {} },
        { provide: UniqueProductIdentifierService, useValue: {} },
      ],
    }).compile();

    controller = module.get<PassportController>(PassportController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("exportPassport", () => {
    it("should call service.exportPassport", async () => {
      const passportId = randomUUID();
      const passport = Passport.create({
        id: passportId,
        organizationId: "org-1",
        environment: Environment.create({}),
      });

      mockPassportRepository.findOneOrFail.mockResolvedValue(passport);
      mockAuthService.getSession.mockResolvedValue({ user: { id: "user-1" } });
      mockAuthService.isMemberOfOrganization.mockResolvedValue(true);

      await controller.exportPassport(passportId, {} as any);
      expect(mockPassportService.exportPassport).toHaveBeenCalledWith(passportId);
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
  describe("importPassport", () => {
    it("should call service.importPassport", async () => {
      const now = new Date();
      const body = {
        id: "passport-1",
        organizationId: "original-org", // Must differ from active org to verify override
        environment: {
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        templateId: null,
      };
      const passport = Passport.create({
        organizationId: "org-1",
        environment: Environment.create({}),
      });

      mockAuthService.getActiveOrganizationId.mockResolvedValue("org-1");
      mockPassportService.importPassport.mockResolvedValue(passport);

      await controller.importPassport(body as any, {} as any);

      expect(mockPassportService.importPassport).toHaveBeenCalledWith(expect.objectContaining({
        ...body,
        organizationId: "org-1",
        createdAt: now,
        updatedAt: now,
      }));
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
});
