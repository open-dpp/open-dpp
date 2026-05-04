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
    listForPassport: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration[]>>;
    createForPassport: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration>>;
    getByIdForPassport: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration>>;
    applyPatchByConfigIdForPassport: jest.Mock<
      (...args: never[]) => Promise<PresentationConfiguration>
    >;
    deleteByConfigIdForPassport: jest.Mock<(...args: never[]) => Promise<void>>;
    getEffectiveForPassport: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration>>;
    listForTemplate: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration[]>>;
    createForTemplate: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration>>;
    getByIdForTemplate: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration>>;
    applyPatchByConfigIdForTemplate: jest.Mock<
      (...args: never[]) => Promise<PresentationConfiguration>
    >;
    deleteByConfigIdForTemplate: jest.Mock<(...args: never[]) => Promise<void>>;
    getEffectiveForTemplate: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration>>;
  };
  let templateRepository: {
    findOneOrFail: jest.Mock<(...args: never[]) => Promise<Template>>;
  };
  let passportRepository: {
    findOneOrFail: jest.Mock<(...args: never[]) => Promise<Passport>>;
  };

  beforeEach(async () => {
    service = {
      listForPassport: jest.fn(),
      createForPassport: jest.fn(),
      getByIdForPassport: jest.fn(),
      applyPatchByConfigIdForPassport: jest.fn(),
      deleteByConfigIdForPassport: jest.fn(),
      getEffectiveForPassport: jest.fn(),
      listForTemplate: jest.fn(),
      createForTemplate: jest.fn(),
      getByIdForTemplate: jest.fn(),
      applyPatchByConfigIdForTemplate: jest.fn(),
      deleteByConfigIdForTemplate: jest.fn(),
      getEffectiveForTemplate: jest.fn(),
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

  // ---- Helpers ----

  function makePassport(organizationId: string): Passport {
    return Passport.create({ organizationId, environment: Environment.create({}) });
  }

  function makeConfig(
    organizationId: string,
    referenceId: string,
    referenceType: (typeof PresentationReferenceType)[keyof typeof PresentationReferenceType],
    overrides: Partial<{
      label: string | null;
      elementDesign: Record<string, (typeof PresentationComponentName)[keyof typeof PresentationComponentName]>;
    }> = {},
  ): PresentationConfiguration {
    return PresentationConfiguration.create({
      organizationId,
      referenceId,
      referenceType,
      label: overrides.label !== undefined ? overrides.label : null,
      elementDesign: overrides.elementDesign,
    });
  }

  // ---- Plural endpoints — Passport ----

  describe("plural endpoints — passport", () => {
    it("listForPassport returns an array of DTOs", async () => {
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const config = makeConfig(organizationId, passport.id, PresentationReferenceType.Passport);
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.listForPassport.mockResolvedValue([config]);

      const result = await controller.listForPassport(
        organizationId,
        passport.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(config.id);
      expect(service.listForPassport).toHaveBeenCalledWith(passport);
    });

    it("listForPassport throws ForbiddenException for cross-organization passport", async () => {
      const passport = makePassport("owner-org");
      passportRepository.findOneOrFail.mockResolvedValue(passport);

      await expect(
        controller.listForPassport("intruder-org", passport.id, UserRole.USER, MemberRole.OWNER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.listForPassport).not.toHaveBeenCalled();
    });

    it("listForPassport throws ForbiddenException when memberRole is missing", async () => {
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      passportRepository.findOneOrFail.mockResolvedValue(passport);

      await expect(
        controller.listForPassport(organizationId, passport.id, UserRole.USER, undefined),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("createForPassport creates a variant and returns the DTO", async () => {
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const created = makeConfig(organizationId, passport.id, PresentationReferenceType.Passport, {
        label: "Variant A",
      });
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.createForPassport.mockResolvedValue(created);

      const result = await controller.createForPassport(
        organizationId,
        passport.id,
        { label: "Variant A" },
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.createForPassport).toHaveBeenCalledWith(passport, { label: "Variant A" });
      expect(result.label).toBe("Variant A");
    });

    it("getByIdForPassport returns the specific config DTO", async () => {
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const config = makeConfig(organizationId, passport.id, PresentationReferenceType.Passport);
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.getByIdForPassport.mockResolvedValue(config);

      const result = await controller.getByIdForPassport(
        organizationId,
        passport.id,
        config.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.getByIdForPassport).toHaveBeenCalledWith(passport, config.id);
      expect(result.id).toBe(config.id);
    });

    it("patchByIdForPassport applies patch and returns updated DTO", async () => {
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const patched = makeConfig(organizationId, passport.id, PresentationReferenceType.Passport, {
        elementDesign: { "submodel.numericField": PresentationComponentName.BigNumber },
      });
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.applyPatchByConfigIdForPassport.mockResolvedValue(patched);

      const result = await controller.patchByIdForPassport(
        organizationId,
        passport.id,
        patched.id,
        { elementDesign: { "submodel.numericField": PresentationComponentName.BigNumber } },
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.applyPatchByConfigIdForPassport).toHaveBeenCalledWith(passport, patched.id, {
        elementDesign: { "submodel.numericField": PresentationComponentName.BigNumber },
      });
      expect(result.elementDesign).toEqual({
        "submodel.numericField": PresentationComponentName.BigNumber,
      });
    });

    it("deleteByIdForPassport calls service and returns void", async () => {
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const configId = randomUUID();
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.deleteByConfigIdForPassport.mockResolvedValue(undefined);

      const result = await controller.deleteByIdForPassport(
        organizationId,
        passport.id,
        configId,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.deleteByConfigIdForPassport).toHaveBeenCalledWith(passport, configId);
      expect(result).toBeUndefined();
    });

    it("getForPassport (singular) returns effective config DTO", async () => {
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const effective = makeConfig(organizationId, passport.id, PresentationReferenceType.Passport);
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.getEffectiveForPassport.mockResolvedValue(effective);

      const result = await controller.getForPassport(
        organizationId,
        passport.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.getEffectiveForPassport).toHaveBeenCalledWith(passport);
      expect(result.id).toBe(effective.id);
    });

    it("getForPassport throws ForbiddenException for cross-organization passport", async () => {
      const passport = makePassport("owner-org");
      passportRepository.findOneOrFail.mockResolvedValue(passport);

      await expect(
        controller.getForPassport("intruder-org", passport.id, UserRole.USER, MemberRole.OWNER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.getEffectiveForPassport).not.toHaveBeenCalled();
    });
  });

  // ---- Plural endpoints — Template ----

  describe("plural endpoints — template", () => {
    it("listForTemplate returns an array of DTOs", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const config = makeConfig(organizationId, template.id, PresentationReferenceType.Template);
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.listForTemplate.mockResolvedValue([config]);

      const result = await controller.listForTemplate(
        organizationId,
        template.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(config.id);
      expect(service.listForTemplate).toHaveBeenCalledWith(template);
    });

    it("listForTemplate throws ForbiddenException for cross-organization template", async () => {
      const template = Template.create({ organizationId: "owner-org" });
      templateRepository.findOneOrFail.mockResolvedValue(template);

      await expect(
        controller.listForTemplate("intruder-org", template.id, UserRole.USER, MemberRole.OWNER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.listForTemplate).not.toHaveBeenCalled();
    });

    it("listForTemplate throws ForbiddenException when memberRole is missing", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      templateRepository.findOneOrFail.mockResolvedValue(template);

      await expect(
        controller.listForTemplate(organizationId, template.id, UserRole.USER, undefined),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("createForTemplate creates a variant and returns the DTO", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const created = makeConfig(
        organizationId,
        template.id,
        PresentationReferenceType.Template,
        { label: "Variant A" },
      );
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.createForTemplate.mockResolvedValue(created);

      const result = await controller.createForTemplate(
        organizationId,
        template.id,
        { label: "Variant A" },
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.createForTemplate).toHaveBeenCalledWith(template, { label: "Variant A" });
      expect(result.label).toBe("Variant A");
    });

    it("getByIdForTemplate returns the specific config DTO", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const config = makeConfig(organizationId, template.id, PresentationReferenceType.Template);
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.getByIdForTemplate.mockResolvedValue(config);

      const result = await controller.getByIdForTemplate(
        organizationId,
        template.id,
        config.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.getByIdForTemplate).toHaveBeenCalledWith(template, config.id);
      expect(result.id).toBe(config.id);
    });

    it("patchByIdForTemplate applies patch and returns updated DTO", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const patched = makeConfig(
        organizationId,
        template.id,
        PresentationReferenceType.Template,
        {
          elementDesign: { "submodel.numericField": PresentationComponentName.BigNumber },
        },
      );
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.applyPatchByConfigIdForTemplate.mockResolvedValue(patched);

      const result = await controller.patchByIdForTemplate(
        organizationId,
        template.id,
        patched.id,
        { elementDesign: { "submodel.numericField": PresentationComponentName.BigNumber } },
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.applyPatchByConfigIdForTemplate).toHaveBeenCalledWith(
        template,
        patched.id,
        { elementDesign: { "submodel.numericField": PresentationComponentName.BigNumber } },
      );
      expect(result.elementDesign).toEqual({
        "submodel.numericField": PresentationComponentName.BigNumber,
      });
    });

    it("patchByIdForTemplate throws ForbiddenException for cross-organization template", async () => {
      const template = Template.create({ organizationId: "owner-org" });
      templateRepository.findOneOrFail.mockResolvedValue(template);

      await expect(
        controller.patchByIdForTemplate(
          "intruder-org",
          template.id,
          randomUUID(),
          { elementDesign: {} },
          UserRole.USER,
          MemberRole.OWNER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.applyPatchByConfigIdForTemplate).not.toHaveBeenCalled();
    });

    it("deleteByIdForTemplate calls service and returns void", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const configId = randomUUID();
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.deleteByConfigIdForTemplate.mockResolvedValue(undefined);

      const result = await controller.deleteByIdForTemplate(
        organizationId,
        template.id,
        configId,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.deleteByConfigIdForTemplate).toHaveBeenCalledWith(template, configId);
      expect(result).toBeUndefined();
    });

    it("getForTemplate (singular) returns effective config DTO", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const config = makeConfig(organizationId, template.id, PresentationReferenceType.Template, {
        elementDesign: { "sm.p": PresentationComponentName.BigNumber },
      });
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.getEffectiveForTemplate.mockResolvedValue(config);

      const result = await controller.getForTemplate(
        organizationId,
        template.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.getEffectiveForTemplate).toHaveBeenCalledWith(template);
      expect(result.id).toBe(config.id);
      expect(result.elementDesign).toEqual({ "sm.p": PresentationComponentName.BigNumber });
    });

    it("getForTemplate throws ForbiddenException when the template belongs to another organization", async () => {
      const template = Template.create({ organizationId: "owner-org" });
      templateRepository.findOneOrFail.mockResolvedValue(template);

      await expect(
        controller.getForTemplate("intruder-org", template.id, UserRole.USER, MemberRole.OWNER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.getEffectiveForTemplate).not.toHaveBeenCalled();
    });

    it("getForTemplate throws ForbiddenException when memberRole is missing", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      templateRepository.findOneOrFail.mockResolvedValue(template);

      await expect(
        controller.getForTemplate(organizationId, template.id, UserRole.USER, undefined),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("getByIdForTemplate throws ForbiddenException for cross-organization template", async () => {
      const template = Template.create({ organizationId: "owner-org" });
      templateRepository.findOneOrFail.mockResolvedValue(template);

      await expect(
        controller.getByIdForTemplate(
          "intruder-org",
          template.id,
          randomUUID(),
          UserRole.USER,
          MemberRole.OWNER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.getByIdForTemplate).not.toHaveBeenCalled();
    });

    it("deleteByIdForTemplate throws ForbiddenException when memberRole is missing", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      templateRepository.findOneOrFail.mockResolvedValue(template);

      await expect(
        controller.deleteByIdForTemplate(
          organizationId,
          template.id,
          randomUUID(),
          UserRole.USER,
          undefined,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.deleteByConfigIdForTemplate).not.toHaveBeenCalled();
    });
  });

  // ---- defaultComponents coverage ----

  describe("defaultComponents in patch", () => {
    it("patchByIdForPassport forwards defaultComponents correctly", async () => {
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const patched = PresentationConfiguration.create({
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
        defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
      });
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.applyPatchByConfigIdForPassport.mockResolvedValue(patched);

      const result = await controller.patchByIdForPassport(
        organizationId,
        passport.id,
        patched.id,
        { defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber } },
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(result.defaultComponents).toEqual({
        [KeyTypes.Property]: PresentationComponentName.BigNumber,
      });
    });
  });
});
