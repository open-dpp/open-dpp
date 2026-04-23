import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import { BadRequestException, Controller, Get, NotFoundException, Query } from "@nestjs/common";
import {
  AssetAdministrationShellPaginationResponseDto,
  BrandingDto,
  BrandingDtoSchema,
  PassportDtoSchema,
  PermalinkListDtoSchema,
  PresentationConfigurationDto,
  PresentationConfigurationDtoSchema,
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelResponseDto,
  ValueResponseDto,
} from "@open-dpp/dto";
import { Branding } from "../../branding/domain/branding";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import {
  ApiGetShells,
  ApiGetSubmodelById,
  ApiGetSubmodelElementById,
  ApiGetSubmodelElements,
  ApiGetSubmodelElementValue,
  ApiGetSubmodels,
  ApiGetSubmodelValue,
  CursorQueryParam,
  IdOrSlugParam,
  IdShortPathParam,
  LimitQueryParam,
  SubmodelIdParam,
} from "../../aas/presentation/aas.decorators";
import { IAasReadEndpoints } from "../../aas/presentation/aas.endpoints";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { BrandingRepository } from "../../branding/infrastructure/branding.repository";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OptionalAuth } from "../../identity/auth/presentation/decorators/optional-auth.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import { Pagination } from "../../pagination/pagination";
import { PresentationConfigurationService } from "../../presentation-configurations/application/services/presentation-configuration.service";
import { PermalinkRepository } from "../infrastructure/permalink.repository";
import { PermalinkApplicationService } from "../application/services/permalink.application.service";

@Controller()
export class PermalinkController implements IAasReadEndpoints {
  constructor(
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly permalinkRepository: PermalinkRepository,
    private readonly environmentService: EnvironmentService,
    private readonly brandingRepository: BrandingRepository,
    private readonly presentationConfigurationService: PresentationConfigurationService,
  ) {}

  @OptionalAuth()
  @Get("/p")
  async getByPassport(@Query("passportId") passportId: string) {
    if (!passportId || passportId.length === 0) {
      throw new BadRequestException("passportId query parameter is required");
    }
    const permalink = await this.permalinkRepository.findByPassportId(passportId);
    return PermalinkListDtoSchema.parse(permalink ? [permalink.toPlain()] : []);
  }

  @OptionalAuth()
  @Get("/p/:id/passport")
  async getReferencedPassport(@IdOrSlugParam() id: string) {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id);
    return PassportDtoSchema.parse(passport);
  }

  @OptionalAuth()
  @Get("/p/:id/presentation-configuration")
  async getPresentationConfiguration(
    @IdOrSlugParam() id: string,
  ): Promise<PresentationConfigurationDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id);
    const config =
      await this.presentationConfigurationService.getEffectiveForPassportReadOnly(passport);
    return PresentationConfigurationDtoSchema.parse(config.toPlain());
  }

  @OptionalAuth()
  @Get("/p/:id/branding")
  async getPassportBranding(@IdOrSlugParam() id: string): Promise<BrandingDto> {
    const metadata = await this.permalinkApplicationService.getMetadataByPermalink(id);
    const branding = await this.loadBrandingOrDefault(metadata.organizationId);
    return BrandingDtoSchema.parse(branding.toPlain());
  }

  private async loadBrandingOrDefault(organizationId: string): Promise<Branding> {
    try {
      return await this.brandingRepository.findOneByOrganizationId(organizationId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return Branding.getDefault();
      }
      throw error;
    }
  }

  @OptionalAuth()
  @ApiGetShells("p")
  async getShells(
    @IdOrSlugParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<AssetAdministrationShellPaginationResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id);
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(
      passport.getEnvironment(),
      pagination,
      subject,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodels("p")
  async getSubmodels(
    @IdOrSlugParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelPaginationResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id);
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(
      passport.getEnvironment(),
      pagination,
      subject,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodelById("p")
  async getSubmodelById(
    @IdOrSlugParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id);
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.environmentService.getSubmodelById(
      passport.getEnvironment(),
      submodelId,
      subject,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodelValue("p")
  async getSubmodelValue(
    @IdOrSlugParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<ValueResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id);
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.environmentService.getSubmodelValue(
      passport.getEnvironment(),
      submodelId,
      subject,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodelElements("p")
  async getSubmodelElements(
    @IdOrSlugParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementPaginationResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id);
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodelElements(
      passport.getEnvironment(),
      submodelId,
      pagination,
      subject,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodelElementById("p")
  async getSubmodelElementById(
    @IdOrSlugParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id);
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.environmentService.getSubmodelElementById(
      passport.getEnvironment(),
      submodelId,
      idShortPath,
      subject,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodelElementValue("p")
  async getSubmodelElementValue(
    @IdOrSlugParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<ValueResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id);
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.environmentService.getSubmodelElementValue(
      passport.getEnvironment(),
      submodelId,
      idShortPath,
      subject,
    );
  }
}
