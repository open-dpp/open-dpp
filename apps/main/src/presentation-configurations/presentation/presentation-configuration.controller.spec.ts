import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import {
  KeyTypes,
  PermissionKind,
  Permissions,
  PresentationComponentName,
  PresentationReferenceType,
} from "@open-dpp/dto";
import { ForbiddenError } from "@open-dpp/exception";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { Environment } from "../../aas/domain/environment";
import { AasAbility } from "../../aas/domain/security/aas-ability";
import { Permission } from "../../aas/domain/security/permission";
import { Security } from "../../aas/domain/security/security";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { Template } from "../../templates/domain/template";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import {
  PresentationConfigurationService,
  PresentationReferenceHolder,
} from "../application/services/presentation-configuration.service";
import { PresentationConfiguration } from "../domain/presentation-configuration";
import { PresentationConfigurationController } from "./presentation-configuration.controller";
import { DigitalProductDocumentService } from "../../digital-product-document/application/digital-product-document.service";
import { ActivityRepository } from "../../activity-history/infrastructure/activity.repository";
import { getConnectionToken } from "@nestjs/mongoose";

describe("PresentationConfigurationController", () => {
  let controller: PresentationConfigurationController;
  let service: {
    list: jest.Mock<(...args: any[]) => Promise<PresentationConfiguration[]>>;
    create: jest.Mock<(...args: any[]) => Promise<PresentationConfiguration>>;
    getById: jest.Mock<(...args: any[]) => Promise<PresentationConfiguration>>;
    applyPatch: jest.Mock<(...args: any[]) => Promise<PresentationConfiguration>>;
    delete: jest.Mock<(...args: any[]) => Promise<void>>;
    getEffective: jest.Mock<(...args: any[]) => Promise<PresentationConfiguration>>;
  };
  let templateRepository: {
    findOneOrFail: jest.Mock<(...args: any[]) => Promise<Template>>;
  };
  let passportRepository: {
    findOneOrFail: jest.Mock<(...args: any[]) => Promise<Passport>>;
  };
  let environmentService: {
    loadAbility: jest.Mock<(...args: any[]) => Promise<AasAbility>>;
  };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      create: jest.fn(),
      getById: jest.fn(),
      applyPatch: jest.fn(),
      delete: jest.fn(),
      getEffective: jest.fn(),
    };
    templateRepository = {
      findOneOrFail: jest.fn(),
    };
    passportRepository = {
      findOneOrFail: jest.fn(),
    };
    const defaultSubject = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.OWNER,
    });
    const defaultAbility = Security.create({}).defineAbilityForSubject(defaultSubject);
    environmentService = {
      loadAbility: jest.fn(async () => defaultAbility),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PresentationConfigurationController],
      providers: [
        { provide: PresentationConfigurationService, useValue: service },
        { provide: TemplateRepository, useValue: templateRepository },
        { provide: PassportRepository, useValue: passportRepository },
        { provide: EnvironmentService, useValue: environmentService },
        { provide: ActivityRepository, useValue: {} },
        {
          provide: getConnectionToken(),
          useValue: {
            startSession: jest.fn(),
            transaction: jest.fn(),
            close: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PresentationConfigurationController>(
      PresentationConfigurationController,
    );
  });

  function makePassport(organizationId: string): Passport {
    return Passport.create({ organizationId, environment: Environment.create({}) });
  }

  function makeConfig(
    organizationId: string,
    referenceId: string,
    referenceType: (typeof PresentationReferenceType)[keyof typeof PresentationReferenceType],
    overrides: Partial<{
      label: string | null;
      elementDesign: Record<
        string,
        (typeof PresentationComponentName)[keyof typeof PresentationComponentName]
      >;
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

  function expectedPassportHolder(passport: Passport): PresentationReferenceHolder {
    return {
      id: passport.id,
      organizationId: passport.organizationId,
      referenceType: PresentationReferenceType.Passport,
    };
  }

  function expectedTemplateHolder(template: Template): PresentationReferenceHolder {
    return {
      id: template.id,
      organizationId: template.organizationId,
      referenceType: PresentationReferenceType.Template,
    };
  }

  describe("plural endpoints — passport", () => {
    it("listForPassport returns an array of DTOs", async () => {
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const config = makeConfig(organizationId, passport.id, PresentationReferenceType.Passport);
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.list.mockResolvedValue([config]);

      const result = await controller.listForPassport(
        organizationId,
        passport.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(config.id);
      expect(environmentService.loadAbility).toHaveBeenCalledWith(
        passport.environment,
        expect.any(SubjectAttributes),
      );
      expect(service.list).toHaveBeenCalledWith(
        expectedPassportHolder(passport),
        expect.any(AasAbility),
      );
    });

    it("listForPassport throws ForbiddenException for cross-organization passport", async () => {
      const passport = makePassport("owner-org");
      passportRepository.findOneOrFail.mockResolvedValue(passport);

      await expect(
        controller.listForPassport("intruder-org", passport.id, UserRole.USER, MemberRole.OWNER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.list).not.toHaveBeenCalled();
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
      service.create.mockResolvedValue(created);

      const result = await controller.createForPassport(
        organizationId,
        passport.id,
        { label: "Variant A" },
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.create).toHaveBeenCalledWith(expectedPassportHolder(passport), {
        label: "Variant A",
      });
      expect(result.label).toBe("Variant A");
    });

    it("getByIdForPassport returns the specific config DTO", async () => {
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const config = makeConfig(organizationId, passport.id, PresentationReferenceType.Passport);
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.getById.mockResolvedValue(config);

      const result = await controller.getByIdForPassport(
        organizationId,
        passport.id,
        config.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(environmentService.loadAbility).toHaveBeenCalledWith(
        passport.environment,
        expect.any(SubjectAttributes),
      );
      expect(service.getById).toHaveBeenCalledWith(
        expectedPassportHolder(passport),
        config.id,
        expect.any(AasAbility),
      );
      expect(result.id).toBe(config.id);
    });

    it("patchByIdForPassport applies patch and returns updated DTO", async () => {
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const patched = makeConfig(organizationId, passport.id, PresentationReferenceType.Passport, {
        elementDesign: { "submodel.numericField": PresentationComponentName.BigNumber },
      });
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.applyPatch.mockResolvedValue(patched);

      const result = await controller.patchByIdForPassport(
        organizationId,
        passport.id,
        patched.id,
        { elementDesign: { "submodel.numericField": PresentationComponentName.BigNumber } },
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(environmentService.loadAbility).toHaveBeenCalledWith(
        passport.environment,
        expect.any(SubjectAttributes),
      );
      expect(service.applyPatch).toHaveBeenCalledWith(
        expectedPassportHolder(passport),
        patched.id,
        { elementDesign: { "submodel.numericField": PresentationComponentName.BigNumber } },
        expect.any(AasAbility),
      );
      expect(result.elementDesign).toEqual({
        "submodel.numericField": PresentationComponentName.BigNumber,
      });
    });

    it("deleteByIdForPassport calls service and returns void", async () => {
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const configId = randomUUID();
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.delete.mockResolvedValue(undefined);

      const result = await controller.deleteByIdForPassport(
        organizationId,
        passport.id,
        configId,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.delete).toHaveBeenCalledWith(expectedPassportHolder(passport), configId);
      expect(result).toBeUndefined();
    });

    it("getForPassport (singular) returns effective config DTO", async () => {
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const effective = makeConfig(organizationId, passport.id, PresentationReferenceType.Passport);
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      service.getEffective.mockResolvedValue(effective);

      const result = await controller.getForPassport(
        organizationId,
        passport.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(environmentService.loadAbility).toHaveBeenCalledWith(
        passport.environment,
        expect.any(SubjectAttributes),
      );
      expect(service.getEffective).toHaveBeenCalledWith(
        expectedPassportHolder(passport),
        expect.any(AasAbility),
      );
      expect(result.id).toBe(effective.id);
    });

    it("getForPassport throws ForbiddenException for cross-organization passport", async () => {
      const passport = makePassport("owner-org");
      passportRepository.findOneOrFail.mockResolvedValue(passport);

      await expect(
        controller.getForPassport("intruder-org", passport.id, UserRole.USER, MemberRole.OWNER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.getEffective).not.toHaveBeenCalled();
    });
  });

  describe("plural endpoints — template", () => {
    it("listForTemplate returns an array of DTOs", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const config = makeConfig(organizationId, template.id, PresentationReferenceType.Template);
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.list.mockResolvedValue([config]);

      const result = await controller.listForTemplate(
        organizationId,
        template.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(config.id);
      expect(environmentService.loadAbility).toHaveBeenCalledWith(
        template.environment,
        expect.any(SubjectAttributes),
      );
      expect(service.list).toHaveBeenCalledWith(
        expectedTemplateHolder(template),
        expect.any(AasAbility),
      );
    });

    it("listForTemplate throws ForbiddenException for cross-organization template", async () => {
      const template = Template.create({ organizationId: "owner-org" });
      templateRepository.findOneOrFail.mockResolvedValue(template);

      await expect(
        controller.listForTemplate("intruder-org", template.id, UserRole.USER, MemberRole.OWNER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.list).not.toHaveBeenCalled();
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
      const created = makeConfig(organizationId, template.id, PresentationReferenceType.Template, {
        label: "Variant A",
      });
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.create.mockResolvedValue(created);

      const result = await controller.createForTemplate(
        organizationId,
        template.id,
        { label: "Variant A" },
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.create).toHaveBeenCalledWith(expectedTemplateHolder(template), {
        label: "Variant A",
      });
      expect(result.label).toBe("Variant A");
    });

    it("getByIdForTemplate returns the specific config DTO", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const config = makeConfig(organizationId, template.id, PresentationReferenceType.Template);
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.getById.mockResolvedValue(config);

      const result = await controller.getByIdForTemplate(
        organizationId,
        template.id,
        config.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(environmentService.loadAbility).toHaveBeenCalledWith(
        template.environment,
        expect.any(SubjectAttributes),
      );
      expect(service.getById).toHaveBeenCalledWith(
        expectedTemplateHolder(template),
        config.id,
        expect.any(AasAbility),
      );
      expect(result.id).toBe(config.id);
    });

    it("patchByIdForTemplate applies patch and returns updated DTO", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const patched = makeConfig(organizationId, template.id, PresentationReferenceType.Template, {
        elementDesign: { "submodel.numericField": PresentationComponentName.BigNumber },
      });
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.applyPatch.mockResolvedValue(patched);

      const result = await controller.patchByIdForTemplate(
        organizationId,
        template.id,
        patched.id,
        { elementDesign: { "submodel.numericField": PresentationComponentName.BigNumber } },
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(environmentService.loadAbility).toHaveBeenCalledWith(
        template.environment,
        expect.any(SubjectAttributes),
      );
      expect(service.applyPatch).toHaveBeenCalledWith(
        expectedTemplateHolder(template),
        patched.id,
        { elementDesign: { "submodel.numericField": PresentationComponentName.BigNumber } },
        expect.any(AasAbility),
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
      expect(service.applyPatch).not.toHaveBeenCalled();
    });

    it("deleteByIdForTemplate calls service and returns void", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const configId = randomUUID();
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.delete.mockResolvedValue(undefined);

      const result = await controller.deleteByIdForTemplate(
        organizationId,
        template.id,
        configId,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(service.delete).toHaveBeenCalledWith(expectedTemplateHolder(template), configId);
      expect(result).toBeUndefined();
    });

    it("getForTemplate (singular) returns effective config DTO", async () => {
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const config = makeConfig(organizationId, template.id, PresentationReferenceType.Template, {
        elementDesign: { "sm.p": PresentationComponentName.BigNumber },
      });
      templateRepository.findOneOrFail.mockResolvedValue(template);
      service.getEffective.mockResolvedValue(config);

      const result = await controller.getForTemplate(
        organizationId,
        template.id,
        UserRole.USER,
        MemberRole.OWNER,
      );

      expect(environmentService.loadAbility).toHaveBeenCalledWith(
        template.environment,
        expect.any(SubjectAttributes),
      );
      expect(service.getEffective).toHaveBeenCalledWith(
        expectedTemplateHolder(template),
        expect.any(AasAbility),
      );
      expect(result.id).toBe(config.id);
      expect(result.elementDesign).toEqual({ "sm.p": PresentationComponentName.BigNumber });
    });

    it("getForTemplate throws ForbiddenException when the template belongs to another organization", async () => {
      const template = Template.create({ organizationId: "owner-org" });
      templateRepository.findOneOrFail.mockResolvedValue(template);

      await expect(
        controller.getForTemplate("intruder-org", template.id, UserRole.USER, MemberRole.OWNER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.getEffective).not.toHaveBeenCalled();
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
      expect(service.getById).not.toHaveBeenCalled();
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
      expect(service.delete).not.toHaveBeenCalled();
    });
  });

  describe("element-level ability flow", () => {
    function buildMemberAbility(): AasAbility {
      const memberSubject = SubjectAttributes.create({
        userRole: UserRole.USER,
        memberRole: MemberRole.MEMBER,
      });
      const security = Security.create({});
      security.addPolicy(memberSubject, IdShortPath.create({ path: "Pub" }), [
        Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
        Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
      ]);
      security.addPolicy(memberSubject, IdShortPath.create({ path: "Secret" }), [
        Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      ]);
      return security.defineAbilityForSubject(memberSubject);
    }

    it("patchByIdForPassport calls loadAbility (not loadExpandedEnvironment) and forwards the ability", async () => {
      const memberAbility = buildMemberAbility();
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const patched = PresentationConfiguration.create({
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
      });
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      environmentService.loadAbility.mockResolvedValue(memberAbility);
      service.applyPatch.mockResolvedValue(patched);

      await controller.patchByIdForPassport(
        organizationId,
        passport.id,
        patched.id,
        { elementDesign: { Pub: PresentationComponentName.BigNumber } },
        UserRole.USER,
        MemberRole.MEMBER,
      );

      expect(environmentService.loadAbility).toHaveBeenCalledWith(
        passport.environment,
        expect.any(SubjectAttributes),
      );
      const lastCall = service.applyPatch.mock.calls.at(-1)!;
      expect(lastCall[3]).toBeInstanceOf(AasAbility);
      expect(lastCall[3]).toBe(memberAbility);
    });

    it("patchByIdForPassport propagates ForbiddenError from the service", async () => {
      const memberAbility = buildMemberAbility();
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      environmentService.loadAbility.mockResolvedValue(memberAbility);
      service.applyPatch.mockRejectedValue(
        new ForbiddenError("Missing edit permission for presentation paths: Secret"),
      );

      await expect(
        controller.patchByIdForPassport(
          organizationId,
          passport.id,
          randomUUID(),
          { elementDesign: { Secret: PresentationComponentName.BigNumber } },
          UserRole.USER,
          MemberRole.MEMBER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("getForPassport calls loadAbility and forwards the ability to the service", async () => {
      const memberAbility = buildMemberAbility();
      const organizationId = randomUUID();
      const passport = makePassport(organizationId);
      const config = makeConfig(organizationId, passport.id, PresentationReferenceType.Passport);
      passportRepository.findOneOrFail.mockResolvedValue(passport);
      environmentService.loadAbility.mockResolvedValue(memberAbility);
      service.getEffective.mockResolvedValue(config);

      await controller.getForPassport(
        organizationId,
        passport.id,
        UserRole.USER,
        MemberRole.MEMBER,
      );

      expect(environmentService.loadAbility).toHaveBeenCalledWith(
        passport.environment,
        expect.any(SubjectAttributes),
      );
      const lastCall = service.getEffective.mock.calls.at(-1)!;
      expect(lastCall[1]).toBeInstanceOf(AasAbility);
      expect(lastCall[1]).toBe(memberAbility);
    });

    it("patchByIdForTemplate calls loadAbility from the template's env and forwards the ability", async () => {
      const memberAbility = buildMemberAbility();
      const organizationId = randomUUID();
      const template = Template.create({ organizationId });
      const patched = PresentationConfiguration.create({
        organizationId,
        referenceId: template.id,
        referenceType: PresentationReferenceType.Template,
      });
      templateRepository.findOneOrFail.mockResolvedValue(template);
      environmentService.loadAbility.mockResolvedValue(memberAbility);
      service.applyPatch.mockResolvedValue(patched);

      await controller.patchByIdForTemplate(
        organizationId,
        template.id,
        patched.id,
        { elementDesign: { Pub: PresentationComponentName.BigNumber } },
        UserRole.USER,
        MemberRole.MEMBER,
      );

      expect(environmentService.loadAbility).toHaveBeenCalledWith(
        template.environment,
        expect.any(SubjectAttributes),
      );
      const lastCall = service.applyPatch.mock.calls.at(-1)!;
      expect(lastCall[3]).toBeInstanceOf(AasAbility);
      expect(lastCall[3]).toBe(memberAbility);
    });
  });

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
      service.applyPatch.mockResolvedValue(patched);

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

  describe("ownership delegation — uses DigitalProductDocumentService", () => {
    it("controller does not have private loadPassportAndCheckOwnership helper (uses DigitalProductDocumentService)", () => {
      // After refactoring, the controller delegates ownership checks to
      // DigitalProductDocumentService instances rather than inline private helpers.
      // Verify the private helpers are gone and the shared service class is used.
      expect(
        (controller as unknown as Record<string, unknown>)["loadPassportAndCheckOwnership"],
      ).toBeUndefined();
      expect(
        (controller as unknown as Record<string, unknown>)["loadTemplateAndCheckOwnership"],
      ).toBeUndefined();
    });

    it("controller holds passportDocService and templateDocService instances of DigitalProductDocumentService", () => {
      const ctrl = controller as unknown as Record<string, unknown>;
      expect(ctrl["passportDocService"]).toBeInstanceOf(DigitalProductDocumentService);
      expect(ctrl["templateDocService"]).toBeInstanceOf(DigitalProductDocumentService);
    });

    it("createForPassport still throws ForbiddenException for cross-org access (ownership via DigitalProductDocumentService)", async () => {
      const passport = makePassport("owner-org");
      passportRepository.findOneOrFail.mockResolvedValue(passport);

      await expect(
        controller.createForPassport(
          "intruder-org",
          passport.id,
          { label: null },
          UserRole.USER,
          MemberRole.OWNER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.create).not.toHaveBeenCalled();
    });

    it("createForTemplate still throws ForbiddenException for cross-org access (ownership via DigitalProductDocumentService)", async () => {
      const template = Template.create({ organizationId: "owner-org" });
      templateRepository.findOneOrFail.mockResolvedValue(template);

      await expect(
        controller.createForTemplate(
          "intruder-org",
          template.id,
          { label: null },
          UserRole.USER,
          MemberRole.OWNER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.create).not.toHaveBeenCalled();
    });
  });
});
