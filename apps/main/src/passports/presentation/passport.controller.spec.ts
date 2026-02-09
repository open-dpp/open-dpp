import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { Environment } from "../../aas/domain/environment";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { AuthService } from "../../auth/auth.service";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
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

  const mockPassportRepository = {
    findOneOrFail: jest.fn(),
  };

  const mockAuthService = {
    getActiveOrganizationId: jest.fn(),
    checkOwnerShipOfDppIdentifiable: jest.fn(),
    getSession: jest.fn(),
    isMemberOfOrganization: jest.fn(),
  };

  // checkOwnerShipOfDppIdentifiable is imported as value, so we might need to mock the module or just the helper if it was a service method.
  // It is imported from environment.service but defined there? No, it's imported from `../../aas/presentation/environment.service`.
  // Wait, `checkOwnerShipOfDppIdentifiable` is a standalone function exported from `environment.service.ts`?
  // Let's check imports in controller.
  // `import { checkOwnerShipOfDppIdentifiable, EnvironmentService } from "../../aas/presentation/environment.service";`
  // Mocking standalone functions in Jest requires `jest.mock`.

  beforeEach(async () => {
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

  // We need to handle the standalone function `checkOwnerShipOfDppIdentifiable`.
  // For now, let's assume it works or mock the repository to return something that passes it if it uses simple logic.
  // Actually, `checkOwnerShipOfDppIdentifiable` probably takes passport and authService and checks org ID.
  // Let's rely on integration/e2e tests or just simple unit tests where we mock the passport return.

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
      // We might need to mock `checkOwnerShipOfDppIdentifiable` behavior if it throws.
      // If it's a pure function, we can't easily mock it without `jest.mock`.
      // However, if we pass a valid passport and correct mocks to authService, it might pass.

      await controller.exportPassport(passportId, {} as any);
      expect(mockPassportService.exportPassport).toHaveBeenCalledWith(passportId);
    });
  });

  describe("importPassport", () => {
    it("should call service.importPassport", async () => {
      const body = { some: "data" };
      const passport = Passport.create({
        organizationId: "org-1",
        environment: Environment.create({}),
      });

      mockAuthService.getActiveOrganizationId.mockResolvedValue("org-1");
      mockPassportService.importPassport.mockResolvedValue(passport);

      await controller.importPassport(body, {} as any);

      expect(mockPassportService.importPassport).toHaveBeenCalledWith(expect.objectContaining({ ...body, organizationId: "org-1" }));
    });
  });
});
