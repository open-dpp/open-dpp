import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { Environment } from "../../aas/domain/environment";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import {
  UniqueProductIdentifierService,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
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

  const mockPassportRepository = {
    findOneOrFail: jest.fn(),
  };

  const mockEnvironmentService = {
    checkOwnerShipOfDppIdentifiable: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PassportController],
      providers: [
        { provide: PassportService, useValue: mockPassportService },
        { provide: PassportRepository, useValue: mockPassportRepository },
        { provide: EnvironmentService, useValue: mockEnvironmentService },
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
      mockEnvironmentService.checkOwnerShipOfDppIdentifiable.mockResolvedValue(passport);

      const session = { activeOrganizationId: "org-1" } as any;
      await controller.exportPassport(passportId, session);
      expect(mockPassportService.exportPassport).toHaveBeenCalledWith(passportId);
    });
  });

  describe("importPassport", () => {
    it("should call service.importPassport", async () => {
      const now = new Date();
      const body = {
        id: "passport-1",
        organizationId: "original-org",
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

      mockPassportService.importPassport.mockResolvedValue(passport);

      const session = { activeOrganizationId: "org-1" } as any;
      await controller.importPassport(body as any, session);

      expect(mockPassportService.importPassport).toHaveBeenCalledWith(expect.objectContaining({
        ...body,
        organizationId: "org-1",
        createdAt: now,
        updatedAt: now,
      }));
    });
  });
});
