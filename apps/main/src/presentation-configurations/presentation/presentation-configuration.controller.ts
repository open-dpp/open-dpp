import type {
  PresentationConfigurationDto,
  PresentationConfigurationPatchDto,
} from "@open-dpp/dto";
import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import { Body, Controller, ForbiddenException, Get, Param, Patch } from "@nestjs/common";
import {
  PresentationConfigurationDtoSchema,
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
    private readonly presentationConfigurationService: PresentationConfigurationService,
    private readonly templateRepository: TemplateRepository,
    private readonly passportRepository: PassportRepository,
  ) {}

  @Get("/templates/:id/presentation-configuration")
  async getForTemplate(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template = await this.loadTemplateAndCheckOwnership(id, subject, organizationId);
    const config = await this.presentationConfigurationService.getOrCreateForTemplate(template);
    return this.toDto(config);
  }

  @Patch("/templates/:id/presentation-configuration")
  async patchForTemplate(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(PresentationConfigurationPatchSchema))
    body: PresentationConfigurationPatchDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template = await this.loadTemplateAndCheckOwnership(id, subject, organizationId);
    const config = await this.presentationConfigurationService.applyPatchForTemplate(
      template,
      body,
    );
    return this.toDto(config);
  }

  @Get("/passports/:id/presentation-configuration")
  async getForPassport(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    const config = await this.presentationConfigurationService.getEffectiveForPassport(passport);
    return this.toDto(config);
  }

  @Patch("/passports/:id/presentation-configuration")
  async patchForPassport(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(PresentationConfigurationPatchSchema))
    body: PresentationConfigurationPatchDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    const config = await this.presentationConfigurationService.applyPatchForPassport(
      passport,
      body,
    );
    return this.toDto(config);
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

  private toDto(config: PresentationConfiguration): PresentationConfigurationDto {
    return PresentationConfigurationDtoSchema.parse(config.toPlain());
  }
}
