import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Query,
} from "@nestjs/common";
import {
  AssetAdministrationShellPaginationResponseDto,
  BrandingDto,
  BrandingDtoSchema,
  PassportDtoSchema,
  PermalinkDtoSchema,
  PermalinkListDtoSchema,
  PermalinkSlugUpdateRequestSchema,
  PresentationConfigurationDto,
  PresentationConfigurationDtoSchema,
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelResponseDto,
  ValueResponseDto,
} from "@open-dpp/dto";
import type { PermalinkSlugUpdateRequest } from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
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
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { BrandingRepository } from "../../branding/infrastructure/branding.repository";
import { isDuplicateKeyError } from "../../lib/mongo-errors";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OptionalAuth } from "../../identity/auth/presentation/decorators/optional-auth.decorator";
import {
  ORGANIZATION_ID_HEADER,
  OrganizationId,
} from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import { Pagination } from "../../pagination/pagination";
import { PresentationConfigurationService } from "../../presentation-configurations/application/services/presentation-configuration.service";
import { PermalinkRepository } from "../infrastructure/permalink.repository";
import { PermalinkApplicationService } from "../application/services/permalink.application.service";

// Note: PermalinkController used to implement IAasReadEndpoints. The added
// access-context parameter (organizationId) for the draft-passport gate
// diverges the signatures from the canonical AAS read shape, so the marker
// interface no longer fits. The controller still exposes the same public
// surface; the implements clause is dropped to avoid forcing organizationId
// into IAasReadEndpoints (which would propagate into every other AAS
// controller).
@Controller()
export class PermalinkController {
  constructor(
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly permalinkRepository: PermalinkRepository,
    private readonly environmentService: EnvironmentService,
    private readonly brandingRepository: BrandingRepository,
    private readonly presentationConfigurationService: PresentationConfigurationService,
  ) {}

  @OptionalAuth()
  @Get("/p")
  async getByPassport(
    @Query("passportId") passportId: string,
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ) {
    if (!passportId || passportId.length === 0) {
      throw new BadRequestException("passportId query parameter is required");
    }
    const permalinks = await this.permalinkRepository.findAllByPassportId(passportId);
    if (permalinks.length === 0) {
      return PermalinkListDtoSchema.parse([]);
    }
    // Hide non-published passports from anonymous / cross-org callers — same
    // gate as resolveToPassport so the listing endpoint can't enumerate
    // draft permalinks. Members of the owning org keep full visibility.
    await this.permalinkApplicationService.resolveToPassport(permalinks[0].id, {
      organizationId,
      memberRole,
    });
    return PermalinkListDtoSchema.parse(permalinks.map((p) => p.toPlain()));
  }

  @OptionalAuth()
  @Get("/p/:id/passport")
  async getReferencedPassport(
    @IdOrSlugParam() id: string,
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ) {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      organizationId,
      memberRole,
    });
    return PassportDtoSchema.parse(passport);
  }

  @OptionalAuth()
  @Get("/p/:id/presentation-configuration")
  async getPresentationConfiguration(
    @IdOrSlugParam() id: string,
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PresentationConfigurationDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      organizationId,
      memberRole,
    });
    const config = await this.presentationConfigurationService.getEffectiveForPassport(passport);
    return PresentationConfigurationDtoSchema.parse(config.toPlain());
  }

  @OptionalAuth()
  @Get("/p/:id/branding")
  async getPassportBranding(
    @IdOrSlugParam() id: string,
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<BrandingDto> {
    const metadata = await this.permalinkApplicationService.getMetadataByPermalink(id, {
      organizationId,
      memberRole,
    });
    const branding = await this.loadBrandingOrDefault(metadata.organizationId);
    return BrandingDtoSchema.parse(branding.toPlain());
  }

  // Authenticated update of a permalink's slug. Permalink IDs are UUID-only
  // (slugs aren't accepted because slug→slug rename via slug lookup would
  // ambiguate the just-changed slug). Member-role on the owning passport's
  // organization is required.
  @Patch("/p/:id/slug")
  async updateSlug(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(PermalinkSlugUpdateRequestSchema))
    body: PermalinkSlugUpdateRequest,
    @OrganizationId() organizationId: string,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ) {
    if (memberRole === undefined) {
      throw new ForbiddenException();
    }
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id);
    if (passport.organizationId !== organizationId) {
      throw new ForbiddenException();
    }
    try {
      const next = await this.permalinkApplicationService.updateSlug(id, body.slug);
      return PermalinkDtoSchema.parse(next.toPlain());
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException("Slug is already taken");
      }
      throw error;
    }
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
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
  ): Promise<AssetAdministrationShellPaginationResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      organizationId,
      memberRole,
    });
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
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
  ): Promise<SubmodelPaginationResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      organizationId,
      memberRole,
    });
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
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
  ): Promise<SubmodelResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      organizationId,
      memberRole,
    });
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
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
  ): Promise<ValueResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      organizationId,
      memberRole,
    });
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
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
  ): Promise<SubmodelElementPaginationResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      organizationId,
      memberRole,
    });
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
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
  ): Promise<SubmodelElementResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      organizationId,
      memberRole,
    });
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
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
  ): Promise<ValueResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      organizationId,
      memberRole,
    });
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.environmentService.getSubmodelElementValue(
      passport.getEnvironment(),
      submodelId,
      idShortPath,
      subject,
    );
  }
}
