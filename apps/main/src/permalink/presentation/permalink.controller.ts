import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Logger,
  Param,
  Patch,
} from "@nestjs/common";
import {
  AssetAdministrationShellPaginationResponseDto,
  PassportPermalinkBundleDto,
  PassportPermalinkBundleDtoSchema,
  PermalinkListDtoSchema,
  PermalinkPublicDtoSchema,
  PermalinkUpdateRequestSchema,
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelResponseDto,
  ValueResponseDto,
} from "@open-dpp/dto";
import type { PermalinkUpdateRequest } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { ZodValidationPipe } from "@open-dpp/exception";
import { Branding } from "../../branding/domain/branding";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { Environment } from "../../aas/domain/environment";
import { AasAbility } from "../../aas/domain/security/aas-ability";
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
  PassportIdQueryParam,
  SubmodelIdParam,
} from "../../aas/presentation/aas.decorators";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { isDuplicateKeyError } from "../../lib/mongo-errors";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OptionalAuth } from "../../identity/auth/presentation/decorators/optional-auth.decorator";
import {
  ORGANIZATION_ID_HEADER,
  OrganizationId,
} from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import { Pagination } from "../../pagination/pagination";
import {
  PresentationConfigurationService,
  PresentationReferenceHolder,
} from "../../presentation-configurations/application/services/presentation-configuration.service";
import { PresentationReferenceType } from "@open-dpp/dto";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { Permalink } from "../domain/permalink";
import { PermalinkRepository } from "../infrastructure/permalink.repository";
import {
  PermalinkApplicationService,
  isMemberOfPassportOrg,
  resolveFallbackBaseUrl,
} from "../application/services/permalink.application.service";

@Controller()
export class PermalinkController {
  private readonly logger = new Logger(PermalinkController.name);

  constructor(
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly permalinkRepository: PermalinkRepository,
    private readonly environmentService: EnvironmentService,
    private readonly presentationConfigurationService: PresentationConfigurationService,
    private readonly passportRepository: PassportRepository,
    private readonly envService: EnvService,
  ) {}

  @OptionalAuth()
  @Get("/p")
  async getByPassport(
    @PassportIdQueryParam() passportId: string,
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ) {
    const passport = await this.passportRepository.findOne(passportId);
    const isMember = passport
      ? isMemberOfPassportOrg(passport, { organizationId, memberRole })
      : false;
    if (!passport || (!passport.isPublished() && !isMember)) {
      return PermalinkListDtoSchema.parse([]);
    }
    const permalinks = await this.permalinkRepository.findAllByPassportId(passportId);
    if (permalinks.length === 0) {
      if (!isMember) {
        return PermalinkListDtoSchema.parse([]);
      }
      const created = await this.environmentService.withTransaction(async (options) => {
        return await this.permalinkApplicationService.ensureDefaultForPassport(passport, options);
      });
      this.logger.debug(
        `Lazy-backfilled permalink for backoffice passportId=${passport.id} → permalink=${created.id}`,
      );
      const branding = await this.resolveBranding(passport.organizationId);
      return PermalinkListDtoSchema.parse([await this.toPublicDto(created, branding, passport)]);
    }
    const branding = await this.resolveBranding(passport.organizationId);
    return PermalinkListDtoSchema.parse(
      await Promise.all(permalinks.map((p) => this.toPublicDto(p, branding, passport))),
    );
  }

  @OptionalAuth()
  @Get("/p/:id")
  async getById(
    @IdOrSlugParam() id: string,
    @Headers(ORGANIZATION_ID_HEADER) organizationId: string | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PassportPermalinkBundleDto> {
    const { permalink, passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      organizationId,
      memberRole,
    });
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const ability = await this.buildAbility(passport.environment, subject);
    const presentationConfiguration = await this.presentationConfigurationService.getEffective(
      passportToHolder(passport),
      ability,
    );
    const branding = await this.resolveBranding(passport.organizationId);
    const { publicUrl } = await this.permalinkApplicationService.resolvePublicUrlWithFreeze(
      permalink,
      passport,
      branding.forPin,
      await this.permalinkApplicationService.getPermalinkBaseUrl(),
    );
    return PassportPermalinkBundleDtoSchema.parse({
      passport: passport.toPlain(),
      branding: branding.display.toPlain(),
      presentationConfiguration: presentationConfiguration.toPlain(),
      publicUrl,
    });
  }

  private async buildAbility(
    environment: Environment,
    subject: SubjectAttributes,
  ): Promise<AasAbility | undefined> {
    const expanded = await this.environmentService.loadExpandedEnvironment(environment);
    if (expanded.shells.length === 0) return undefined;
    return expanded.shells[0].security.defineAbilityForSubject(subject);
  }

  @Patch("/p/:id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(PermalinkUpdateRequestSchema))
    body: PermalinkUpdateRequest,
    @OrganizationId() organizationId: string,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ) {
    if (memberRole === undefined) {
      throw new ForbiddenException();
    }
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      organizationId,
      memberRole,
    });
    if (passport.organizationId !== organizationId) {
      throw new ForbiddenException();
    }
    try {
      const update: { slug?: string | null; baseUrl?: string | null } = {};
      if (body.slug !== undefined) update.slug = body.slug;
      if (body.baseUrl !== undefined) update.baseUrl = body.baseUrl;
      const next = await this.permalinkApplicationService.updatePermalink(id, update);
      const branding = await this.resolveBranding(passport.organizationId);
      return PermalinkPublicDtoSchema.parse(await this.toPublicDto(next, branding, passport));
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException("Slug is already taken");
      }
      throw error;
    }
  }

  private async resolveBranding(
    organizationId: string,
  ): Promise<{ display: Branding; forPin: Branding | null }> {
    try {
      const branding = await this.permalinkApplicationService.loadBranding(organizationId);
      return { display: branding, forPin: branding };
    } catch (error) {
      this.logger.warn(
        `Branding load failed for organizationId=${organizationId}; serving default branding and skipping permalink URL pinning`,
        error instanceof Error ? error.stack : String(error),
      );
      return { display: Branding.getDefault(), forPin: null };
    }
  }

  private async toPublicDto(
    permalink: Permalink,
    branding: { display: Branding; forPin: Branding | null },
    passport: Passport,
  ) {
    const envUrl = await this.permalinkApplicationService.getPermalinkBaseUrl();
    const fallback = resolveFallbackBaseUrl(branding.display, envUrl);
    const resolved = await this.permalinkApplicationService.resolvePublicUrlWithFreeze(
      permalink,
      passport,
      branding.forPin,
      envUrl,
    );
    return {
      ...resolved.permalink.toPlain(),
      publicUrl: resolved.publicUrl,
      fallbackBaseUrl: fallback.url,
      fallbackBaseUrlSource: fallback.source,
    };
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

function passportToHolder(passport: Passport): PresentationReferenceHolder {
  return {
    id: passport.id,
    organizationId: passport.organizationId,
    referenceType: PresentationReferenceType.Passport,
  };
}
