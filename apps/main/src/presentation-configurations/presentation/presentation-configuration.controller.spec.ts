import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { KeyTypes, PresentationComponentName, PresentationReferenceType } from "@open-dpp/dto";
import { Environment } from "../../aas/domain/environment";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { Template } from "../../templates/domain/template";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import { PresentationConfigurationService } from "../application/services/presentation-configuration.service";
import { PresentationConfiguration } from "../domain/presentation-configuration";
import { PresentationConfigurationController } from "./presentation-configuration.controller";

describe("PresentationConfigurationController", () => {
  let controller: PresentationConfigurationController;
  let service: {
    getOrCreateForTemplate: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration>>;
    getOrCreateForPassport: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration>>;
    getEffectiveForPassport: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration>>;
    applyPatchForTemplate: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration>>;
    applyPatchForPassport: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration>>;
  };
  let templateRepository: {
    findOneOrFail: jest.Mock<(...args: never[]) => Promise<Template>>;
  };
  let passportRepository: {
    findOneOrFail: jest.Mock<(...args: never[]) => Promise<Passport>>;
  };

  beforeEach(async () => {
    service = {
      getOrCreateForTemplate: jest.fn(),
      getOrCreateForPassport: jest.fn(),
      getEffectiveForPassport: jest.fn(),
      applyPatchForTemplate: jest.fn(),
      applyPatchForPassport: jest.fn(),
    };
    templateRepository = {
      findOneOrFail: jest.fn(),
    };
    passportRepository = {
      findOneOrFail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PresentationConfigurationController],
      providers: [
        { provide: PresentationConfigurationService, useValue: service },
        { provide: TemplateRepository, useValue: templateRepository },
        { provide: PassportRepository, useValue: passportRepository },
      ],
    }).compile();

    controller = module.get<PresentationConfigurationController>(
      PresentationConfigurationController,
    );
  });

  describe("getForTemplate", () => {
    it("returns the DTO of the template's presentation configuration", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const config = PresentationConfiguration.create({
        organizationId,
        referenceId: template.id,
        referenceType: PresentationReferenceType.Template,
        elementDesign: { "sm.p": PresentationComponentName.BigNumber },
      });
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.getOrCreateForTemplate.mockResolvedValue(config);

      const result = await controller.getForTemplate(
        organizationId,
        template.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(result.id).toBe(config.id);
      expect(result.elementDesign).toEqual({ "sm.p": PresentationComponentName.BigNumber });
    });

    it("throws ForbiddenException when the template belongs to another organization", async () => {
      const template = Template.create({ organizationId: "owner-org" });
      templateRepository.findOneOrFail.mockResolvedValue(template);

      await expect(
        controller.getForTemplate("intruder-org", template.id, UserRole.USER, MemberRole.OWNER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.getOrCreateForTemplate).not.toHaveBeenCalled();
    });

    it("throws ForbiddenException when memberRole is missing", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      templateRepository.findOneOrFail.mockResolvedValue(template);

      await expect(
        controller.getForTemplate(organizationId, template.id, UserRole.USER, undefined),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("patchForTemplate", () => {
    it("applies the patch and returns the updated DTO", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const patched = PresentationConfiguration.create({
        organizationId,
        referenceId: template.id,
        referenceType: PresentationReferenceType.Template,
        elementDesign: { "sm.p": PresentationComponentName.BigNumber },
        defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
      });
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.applyPatchForTemplate.mockResolvedValue(patched);

      const result = await controller.patchForTemplate(
        organizationId,
        template.id,
        {
          elementDesign: { "sm.p": PresentationComponentName.BigNumber },
        },
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.applyPatchForTemplate).toHaveBeenCalledWith(template, {
        elementDesign: { "sm.p": PresentationComponentName.BigNumber },
      });
      expect(result.elementDesign).toEqual({ "sm.p": PresentationComponentName.BigNumber });
    });
  });

  describe("getForPassport", () => {
    it("returns the effective (merged) config via service.getEffectiveForPassport", async () => {
      const organizationId = randomUUID();
      const passport = Passport.create({
        organizationId,
        environment: Environment.create({}),
      });
      const effective = PresentationConfiguration.create({
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
        elementDesign: {
          "from.template": PresentationComponentName.BigNumber,
          "from.passport": PresentationComponentName.BigNumber,
        },
      });
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.getEffectiveForPassport.mockResolvedValue(effective);

      const result = await controller.getForPassport(
        organizationId,
        passport.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.getEffectiveForPassport).toHaveBeenCalledWith(passport);
      expect(result.elementDesign).toEqual({
        "from.template": PresentationComponentName.BigNumber,
        "from.passport": PresentationComponentName.BigNumber,
      });
    });

    it("throws ForbiddenException for a cross-organization passport", async () => {
      const passport = Passport.create({
        organizationId: "owner-org",
        environment: Environment.create({}),
      });
      passportRepository.findOneOrFail.mockResolvedValue(passport);

      await expect(
        controller.getForPassport("intruder-org", passport.id, UserRole.USER, MemberRole.OWNER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.getEffectiveForPassport).not.toHaveBeenCalled();
    });
  });

  describe("patchForPassport", () => {
    it("applies the patch against the passport's own config", async () => {
      const organizationId = randomUUID();
      const passport = Passport.create({
        organizationId,
        environment: Environment.create({}),
      });
      const patched = PresentationConfiguration.create({
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
      });
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.applyPatchForPassport.mockResolvedValue(patched);

      const result = await controller.patchForPassport(
        organizationId,
        passport.id,
        { elementDesign: { "sm.p": null } },
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.applyPatchForPassport).toHaveBeenCalledWith(passport, {
        elementDesign: { "sm.p": null },
      });
      expect(result.referenceType).toBe(PresentationReferenceType.Passport);
    });
  });
});
