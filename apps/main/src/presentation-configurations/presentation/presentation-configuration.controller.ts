import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  forwardRef,
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
  PresentationReferenceType,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { Template } from "../../templates/domain/template";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import { DigitalProductDocumentService } from "../../digital-product-document/application/digital-product-document.service";
import { PresentationConfiguration } from "../domain/presentation-configuration";
import {
  PresentationConfigurationService,
  PresentationReferenceHolder,
} from "../application/services/presentation-configuration.service";

@Controller()
export class PresentationConfigurationController {
  private readonly passportDocService: DigitalProductDocumentService<Passport>;
  private readonly templateDocService: DigitalProductDocumentService<Template>;

  constructor(
    private readonly service: PresentationConfigurationService,
    private readonly templateRepository: TemplateRepository,
    private readonly passportRepository: PassportRepository,
    @Inject(forwardRef(() => EnvironmentService))
    private readonly environmentService: EnvironmentService,
  ) {
    this.passportDocService = new DigitalProductDocumentService(
      this.environmentService,
      this.passportRepository,
    );
    this.templateDocService = new DigitalProductDocumentService(
      this.environmentService,
      this.templateRepository,
    );
  }

  @Get("/passports/:id/presentation-configurations")
  async listForPassport(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.passportDocService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const ability = await this.environmentService.loadAbility(passport.environment, subject);
    const holder = toPassportHolder(passport);
    const list = await this.service.list(holder, ability);
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
    const passport = await this.passportDocService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const created = await this.service.create(toPassportHolder(passport), body);
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
    const passport = await this.passportDocService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const ability = await this.environmentService.loadAbility(passport.environment, subject);
    const c = await this.service.getById(toPassportHolder(passport), configId, ability);
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
    const passport = await this.passportDocService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const ability = await this.environmentService.loadAbility(passport.environment, subject);
    const c = await this.service.applyPatch(toPassportHolder(passport), configId, body, ability);
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
    const passport = await this.passportDocService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    await this.service.delete(toPassportHolder(passport), configId);
  }

  @Get("/templates/:id/presentation-configurations")
  async listForTemplate(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template = await this.templateDocService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const ability = await this.environmentService.loadAbility(template.environment, subject);
    const holder = toTemplateHolder(template);
    const list = await this.service.list(holder, ability);
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
    const template = await this.templateDocService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const created = await this.service.create(toTemplateHolder(template), body);
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
    const template = await this.templateDocService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const ability = await this.environmentService.loadAbility(template.environment, subject);
    const c = await this.service.getById(toTemplateHolder(template), configId, ability);
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
    const template = await this.templateDocService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const ability = await this.environmentService.loadAbility(template.environment, subject);
    const c = await this.service.applyPatch(toTemplateHolder(template), configId, body, ability);
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
    const template = await this.templateDocService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    await this.service.delete(toTemplateHolder(template), configId);
  }

  @Get("/passports/:id/presentation-configuration")
  async getForPassport(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.passportDocService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const ability = await this.environmentService.loadAbility(passport.environment, subject);
    const c = await this.service.getEffective(toPassportHolder(passport), ability);
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
    const template = await this.templateDocService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const ability = await this.environmentService.loadAbility(template.environment, subject);
    const c = await this.service.getEffective(toTemplateHolder(template), ability);
    return this.toDto(c);
  }

  private toDto(config: PresentationConfiguration): PresentationConfigurationDto {
    return PresentationConfigurationDtoSchema.parse(config.toPlain());
  }
}

function toPassportHolder(passport: Passport): PresentationReferenceHolder {
  return {
    id: passport.id,
    organizationId: passport.organizationId,
    referenceType: PresentationReferenceType.Passport,
  };
}

function toTemplateHolder(template: Template): PresentationReferenceHolder {
  return {
    id: template.id,
    organizationId: template.organizationId,
    referenceType: PresentationReferenceType.Template,
  };
}
