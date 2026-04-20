import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { PresentationReferenceType } from "@open-dpp/dto";
import { Environment } from "../../../aas/domain/environment";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import { PresentationConfiguration } from "../../domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../infrastructure/presentation-configuration.repository";
import { PresentationConfigurationService } from "./presentation-configuration.service";

describe("PresentationConfigurationService", () => {
  let service: PresentationConfigurationService;
  let mockRepository: {
    findOrCreateByReference: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration>>;
  };

  beforeEach(async () => {
    mockRepository = {
      findOrCreateByReference: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PresentationConfigurationService,
        {
          provide: PresentationConfigurationRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PresentationConfigurationService>(PresentationConfigurationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getOrCreateForTemplate", () => {
    it("maps a Template to PresentationReferenceType.Template and forwards id + organizationId", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const stub = PresentationConfiguration.create({
        organizationId,
        referenceId: template.id,
        referenceType: PresentationReferenceType.Template,
      });
      mockRepository.findOrCreateByReference.mockResolvedValue(stub);

      const result = await service.getOrCreateForTemplate(template);

      expect(mockRepository.findOrCreateByReference).toHaveBeenCalledTimes(1);
      expect(mockRepository.findOrCreateByReference).toHaveBeenCalledWith({
        referenceType: PresentationReferenceType.Template,
        referenceId: template.id,
        organizationId: template.organizationId,
      });
      // Swap sentinel: must NOT pass the Passport enum value.
      expect(mockRepository.findOrCreateByReference).not.toHaveBeenCalledWith(
        expect.objectContaining({ referenceType: PresentationReferenceType.Passport }),
      );
      expect(result).toBe(stub);
    });
  });

  describe("getOrCreateForPassport", () => {
    it("maps a Passport to PresentationReferenceType.Passport and forwards id + organizationId", async () => {
      const organizationId = randomUUID();
      const passport = Passport.create({
        organizationId,
        environment: Environment.create({}),
      });
      const stub = PresentationConfiguration.create({
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
      });
      mockRepository.findOrCreateByReference.mockResolvedValue(stub);

      const result = await service.getOrCreateForPassport(passport);

      expect(mockRepository.findOrCreateByReference).toHaveBeenCalledTimes(1);
      expect(mockRepository.findOrCreateByReference).toHaveBeenCalledWith({
        referenceType: PresentationReferenceType.Passport,
        referenceId: passport.id,
        organizationId: passport.organizationId,
      });
      // Swap sentinel: must NOT pass the Template enum value.
      expect(mockRepository.findOrCreateByReference).not.toHaveBeenCalledWith(
        expect.objectContaining({ referenceType: PresentationReferenceType.Template }),
      );
      expect(result).toBe(stub);
    });
  });
});
