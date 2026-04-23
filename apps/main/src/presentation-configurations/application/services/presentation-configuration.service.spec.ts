import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { KeyTypes, PresentationComponentName, PresentationReferenceType } from "@open-dpp/dto";
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
    findByReference: jest.Mock<
      (...args: never[]) => Promise<PresentationConfiguration | undefined>
    >;
    save: jest.Mock<(...args: never[]) => Promise<PresentationConfiguration>>;
  };

  beforeEach(async () => {
    mockRepository = {
      findOrCreateByReference: jest.fn(),
      findByReference: jest.fn(),
      save: jest.fn(),
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
      expect(mockRepository.findOrCreateByReference).not.toHaveBeenCalledWith(
        expect.objectContaining({ referenceType: PresentationReferenceType.Template }),
      );
      expect(result).toBe(stub);
    });
  });

  describe("applyPatchForTemplate", () => {
    it("applies elementDesign sets and deletes and persists the result", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const existing = PresentationConfiguration.create({
        organizationId,
        referenceId: template.id,
        referenceType: PresentationReferenceType.Template,
        elementDesign: { "a.b": PresentationComponentName.BigNumber },
      });
      mockRepository.findOrCreateByReference.mockResolvedValue(existing);
      mockRepository.save.mockImplementation(async (c: PresentationConfiguration) => c);

      const result = await service.applyPatchForTemplate(template, {
        elementDesign: {
          "x.y": PresentationComponentName.BigNumber,
          "a.b": null,
        },
      });

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(result.elementDesign.get("a.b")).toBeUndefined();
      expect(result.elementDesign.get("x.y")).toBe(PresentationComponentName.BigNumber);
    });

    it("applies defaultComponents sets and deletes", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const existing = PresentationConfiguration.create({
        organizationId,
        referenceId: template.id,
        referenceType: PresentationReferenceType.Template,
        defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
      });
      mockRepository.findOrCreateByReference.mockResolvedValue(existing);
      mockRepository.save.mockImplementation(async (c: PresentationConfiguration) => c);

      const result = await service.applyPatchForTemplate(template, {
        defaultComponents: { [KeyTypes.Property]: null },
      });

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(result.defaultComponents.get(KeyTypes.Property)).toBeUndefined();
    });

    it("does not call save when the patch is a no-op", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const existing = PresentationConfiguration.create({
        organizationId,
        referenceId: template.id,
        referenceType: PresentationReferenceType.Template,
      });
      mockRepository.findOrCreateByReference.mockResolvedValue(existing);

      const result = await service.applyPatchForTemplate(template, {});

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });

    it("does not call save when the patch sets values identical to the current ones", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const existing = PresentationConfiguration.create({
        organizationId,
        referenceId: template.id,
        referenceType: PresentationReferenceType.Template,
        elementDesign: { "a.b": PresentationComponentName.BigNumber },
        defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
      });
      mockRepository.findOrCreateByReference.mockResolvedValue(existing);

      const result = await service.applyPatchForTemplate(template, {
        elementDesign: { "a.b": PresentationComponentName.BigNumber },
        defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
      });

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });
  });

  describe("applyPatchForPassport", () => {
    it("persists patches against the passport's config", async () => {
      const organizationId = randomUUID();
      const passport = Passport.create({
        organizationId,
        environment: Environment.create({}),
      });
      const existing = PresentationConfiguration.create({
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
      });
      mockRepository.findOrCreateByReference.mockResolvedValue(existing);
      mockRepository.save.mockImplementation(async (c: PresentationConfiguration) => c);

      const result = await service.applyPatchForPassport(passport, {
        elementDesign: { "sm.p": PresentationComponentName.BigNumber },
      });

      expect(mockRepository.findOrCreateByReference).toHaveBeenCalledWith({
        referenceType: PresentationReferenceType.Passport,
        referenceId: passport.id,
        organizationId,
      });
      expect(result.elementDesign.get("sm.p")).toBe(PresentationComponentName.BigNumber);
    });
  });

  describe("getEffectiveForPassport", () => {
    it("returns the passport config unchanged when the passport has no template", async () => {
      const organizationId = randomUUID();
      const passport = Passport.create({
        organizationId,
        environment: Environment.create({}),
      });
      const passportConfig = PresentationConfiguration.create({
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
        elementDesign: { "sm.p": PresentationComponentName.BigNumber },
      });
      mockRepository.findOrCreateByReference.mockResolvedValue(passportConfig);

      const result = await service.getEffectiveForPassport(passport);

      expect(result).toBe(passportConfig);
      expect(mockRepository.findByReference).not.toHaveBeenCalled();
    });

    it("merges template config under passport overrides when the passport has a templateId", async () => {
      const organizationId = randomUUID();
      const templateId = randomUUID();
      const passport = Passport.create({
        organizationId,
        templateId,
        environment: Environment.create({}),
      });
      const templateConfig = PresentationConfiguration.create({
        organizationId,
        referenceId: templateId,
        referenceType: PresentationReferenceType.Template,
        elementDesign: {
          "template.only": PresentationComponentName.BigNumber,
          "shared.path": PresentationComponentName.BigNumber,
        },
        defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
      });
      const passportConfig = PresentationConfiguration.create({
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
        elementDesign: {
          "passport.only": PresentationComponentName.BigNumber,
        },
      });
      mockRepository.findOrCreateByReference.mockResolvedValue(passportConfig);
      mockRepository.findByReference.mockResolvedValue(templateConfig);

      const result = await service.getEffectiveForPassport(passport);

      expect(result.referenceId).toBe(passport.id);
      expect(result.referenceType).toBe(PresentationReferenceType.Passport);
      expect(Object.fromEntries(result.elementDesign)).toEqual({
        "template.only": PresentationComponentName.BigNumber,
        "shared.path": PresentationComponentName.BigNumber,
        "passport.only": PresentationComponentName.BigNumber,
      });
      expect(Object.fromEntries(result.defaultComponents)).toEqual({
        [KeyTypes.Property]: PresentationComponentName.BigNumber,
      });
    });

    it("returns the passport config when the template has no config row", async () => {
      const organizationId = randomUUID();
      const templateId = randomUUID();
      const passport = Passport.create({
        organizationId,
        templateId,
        environment: Environment.create({}),
      });
      const passportConfig = PresentationConfiguration.create({
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
      });
      mockRepository.findOrCreateByReference.mockResolvedValue(passportConfig);
      mockRepository.findByReference.mockResolvedValue(undefined);

      const result = await service.getEffectiveForPassport(passport);

      expect(result).toBe(passportConfig);
    });

    it("template defaults bleed through when the passport has none", async () => {
      const organizationId = randomUUID();
      const templateId = randomUUID();
      const passport = Passport.create({
        organizationId,
        templateId,
        environment: Environment.create({}),
      });
      const templateConfig = PresentationConfiguration.create({
        organizationId,
        referenceId: templateId,
        referenceType: PresentationReferenceType.Template,
        defaultComponents: { [KeyTypes.Property]: PresentationComponentName.BigNumber },
      });
      const passportConfig = PresentationConfiguration.create({
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
      });
      mockRepository.findOrCreateByReference.mockResolvedValue(passportConfig);
      mockRepository.findByReference.mockResolvedValue(templateConfig);

      const result = await service.getEffectiveForPassport(passport);

      expect(result.defaultComponents.get(KeyTypes.Property)).toBe(
        PresentationComponentName.BigNumber,
      );
    });
  });

  describe("getEffectiveForPassportReadOnly", () => {
    it("never calls findOrCreateByReference (no writes)", async () => {
      const organizationId = randomUUID();
      const passport = Passport.create({
        organizationId,
        environment: Environment.create({}),
      });
      mockRepository.findByReference.mockResolvedValue(undefined);

      const result = await service.getEffectiveForPassportReadOnly(passport);

      expect(mockRepository.findOrCreateByReference).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(result.elementDesign.size).toBe(0);
      expect(result.defaultComponents.size).toBe(0);
    });

    it("merges template config under an in-memory empty passport config when no rows exist", async () => {
      const organizationId = randomUUID();
      const templateId = randomUUID();
      const passport = Passport.create({
        organizationId,
        templateId,
        environment: Environment.create({}),
      });
      const templateConfig = PresentationConfiguration.create({
        organizationId,
        referenceId: templateId,
        referenceType: PresentationReferenceType.Template,
        elementDesign: { "sm.p": PresentationComponentName.BigNumber },
      });
      mockRepository.findByReference
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(templateConfig);

      const result = await service.getEffectiveForPassportReadOnly(passport);

      expect(mockRepository.findOrCreateByReference).not.toHaveBeenCalled();
      expect(result.elementDesign.get("sm.p")).toBe(PresentationComponentName.BigNumber);
    });

    it("returns a persisted passport config unchanged when the passport has no template", async () => {
      const organizationId = randomUUID();
      const passport = Passport.create({
        organizationId,
        environment: Environment.create({}),
      });
      const passportConfig = PresentationConfiguration.create({
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
        elementDesign: { "sm.p": PresentationComponentName.BigNumber },
      });
      mockRepository.findByReference.mockResolvedValueOnce(passportConfig);

      const result = await service.getEffectiveForPassportReadOnly(passport);

      expect(mockRepository.findOrCreateByReference).not.toHaveBeenCalled();
      expect(mockRepository.findByReference).toHaveBeenCalledTimes(1);
      expect(result).toBe(passportConfig);
    });

    it("merges a persisted passport config with a persisted template config", async () => {
      const organizationId = randomUUID();
      const templateId = randomUUID();
      const passport = Passport.create({
        organizationId,
        templateId,
        environment: Environment.create({}),
      });
      const templateConfig = PresentationConfiguration.create({
        organizationId,
        referenceId: templateId,
        referenceType: PresentationReferenceType.Template,
        elementDesign: {
          "template.only": PresentationComponentName.BigNumber,
          "shared.path": PresentationComponentName.BigNumber,
        },
      });
      const passportConfig = PresentationConfiguration.create({
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
        elementDesign: { "passport.only": PresentationComponentName.BigNumber },
      });
      mockRepository.findByReference
        .mockResolvedValueOnce(passportConfig)
        .mockResolvedValueOnce(templateConfig);

      const result = await service.getEffectiveForPassportReadOnly(passport);

      expect(mockRepository.findOrCreateByReference).not.toHaveBeenCalled();
      expect(Object.fromEntries(result.elementDesign)).toEqual({
        "template.only": PresentationComponentName.BigNumber,
        "shared.path": PresentationComponentName.BigNumber,
        "passport.only": PresentationComponentName.BigNumber,
      });
    });
  });
});
