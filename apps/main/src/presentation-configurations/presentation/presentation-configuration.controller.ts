import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import type {
  PresentationConfigurationCreateRequestDto,
  PresentationConfigurationDto,
  PresentationConfigurationListResponseDto,
  PresentationConfigurationPatchDto,
} from "@open-dpp/dto";
import {
  PresentationConfigurationCreateRequestSchema,
  PresentationConfigurationDtoSchema,
  PresentationConfigurationListResponseSchema,
  PresentationConfigurationPatchSchema,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { Template } from "../../templates/domain/template";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import { PresentationConfiguration } from "../domain/presentation-configuration";
import { PresentationConfigurationService } from "../application/services/presentation-configuration.service";

@Controller()
export class PresentationConfigurationController {
  constructor(
    private readonly service: PresentationConfigurationService,
    private readonly templateRepository: TemplateRepository,
    private readonly passportRepository: PassportRepository,
  ) {}

  // ---- Plural (editor surface) — Passport ----

  @Get("/passports/:id/presentation-configurations")
  async listForPassport(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    const list = await this.service.listForPassport(passport);
    return PresentationConfigurationListResponseSchema.parse(list.map((c) => c.toPlain()));
  }

  @Post("/passports/:id/presentation-configurations")
  async createForPassport(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(PresentationConfigurationCreateRequestSchema))
    body: PresentationConfigurationCreateRequestDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    const created = await this.service.createForPassport(passport, body);
    return this.toDto(created);
  }

  @Get("/passports/:id/presentation-configurations/:configId")
  async getByIdForPassport(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @Param("configId") configId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    const c = await this.service.getByIdForPassport(passport, configId);
    return this.toDto(c);
  }

  @Patch("/passports/:id/presentation-configurations/:configId")
  async patchByIdForPassport(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @Param("configId") configId: string,
    @Body(new ZodValidationPipe(PresentationConfigurationPatchSchema))
    body: PresentationConfigurationPatchDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    const c = await this.service.applyPatchByConfigIdForPassport(passport, configId, body);
    return this.toDto(c);
  }

  @Delete("/passports/:id/presentation-configurations/:configId")
  @HttpCode(204)
  async deleteByIdForPassport(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @Param("configId") configId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<void> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    await this.service.deleteByConfigIdForPassport(passport, configId);
  }

  // ---- Plural (editor surface) — Template ----

  @Get("/templates/:id/presentation-configurations")
  async listForTemplate(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template = await this.loadTemplateAndCheckOwnership(id, subject, organizationId);
    const list = await this.service.listForTemplate(template);
    return PresentationConfigurationListResponseSchema.parse(list.map((c) => c.toPlain()));
  }

  @Post("/templates/:id/presentation-configurations")
  async createForTemplate(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(PresentationConfigurationCreateRequestSchema))
    body: PresentationConfigurationCreateRequestDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template = await this.loadTemplateAndCheckOwnership(id, subject, organizationId);
    const created = await this.service.createForTemplate(template, body);
    return this.toDto(created);
  }

  @Get("/templates/:id/presentation-configurations/:configId")
  async getByIdForTemplate(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @Param("configId") configId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template = await this.loadTemplateAndCheckOwnership(id, subject, organizationId);
    const c = await this.service.getByIdForTemplate(template, configId);
    return this.toDto(c);
  }

  @Patch("/templates/:id/presentation-configurations/:configId")
  async patchByIdForTemplate(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @Param("configId") configId: string,
    @Body(new ZodValidationPipe(PresentationConfigurationPatchSchema))
    body: PresentationConfigurationPatchDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template = await this.loadTemplateAndCheckOwnership(id, subject, organizationId);
    const c = await this.service.applyPatchByConfigIdForTemplate(template, configId, body);
    return this.toDto(c);
  }

  @Delete("/templates/:id/presentation-configurations/:configId")
  @HttpCode(204)
  async deleteByIdForTemplate(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @Param("configId") configId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<void> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template = await this.loadTemplateAndCheckOwnership(id, subject, organizationId);
    await this.service.deleteByConfigIdForTemplate(template, configId);
  }

  // ---- Singular (viewer surface) ----

  @Get("/passports/:id/presentation-configuration")
  async getForPassport(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    const c = await this.service.getEffectiveForPassport(passport);
    return this.toDto(c);
  }

  @Get("/templates/:id/presentation-configuration")
  async getForTemplate(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template = await this.loadTemplateAndCheckOwnership(id, subject, organizationId);
    const c = await this.service.getEffectiveForTemplate(template);
    return this.toDto(c);
  }

  // ---- Helpers ----

  private toDto(config: PresentationConfiguration): PresentationConfigurationDto {
    return PresentationConfigurationDtoSchema.parse(config.toPlain());
  }

  private async loadTemplateAndCheckOwnership(
    id: string,
    subject: SubjectAttributes,
    organizationId: string,
  ): Promise<Template> {
    const template = await this.templateRepository.findOneOrFail(id);
    if (template.getOrganizationId() !== organizationId || subject.memberRole === undefined) {
      throw new ForbiddenException();
    }
    return template;
  }

  private async loadPassportAndCheckOwnership(
    id: string,
    subject: SubjectAttributes,
    organizationId: string,
  ): Promise<Passport> {
    const passport = await this.passportRepository.findOneOrFail(id);
    if (passport.getOrganizationId() !== organizationId || subject.memberRole === undefined) {
      throw new ForbiddenException();
    }
    return passport;
  }
}
