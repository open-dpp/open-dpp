import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import {
  AssetAdministrationShellPaginationResponseDto,
  PassportPermalinkBundleDto,
  PassportPermalinkBundleDtoSchema,
  PermalinkCreateRequestSchema,
  PermalinkKind,
  PermalinkListDtoSchema,
  PermalinkPaginationDtoSchema,
  PermalinkPublicDtoSchema,
  PermalinkUpdateRequestSchema,
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelResponseDto,
  ValueResponseDto,
} from "@open-dpp/dto";
import type { PermalinkCreateRequest, PermalinkUpdateRequest } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { ValueError, ZodValidationPipe } from "@open-dpp/exception";
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
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
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
import { LimitQueryParam } from "../../digital-product-document/presentation/digital-product-document-decorators";
import { UniqueProductIdentifierRepository } from "../../unique-product-identifier/infrastructure/unique-product-identifier.repository";

@Controller()
export class PermalinkController {
  private readonly logger = new Logger(PermalinkController.name);

  constructor(
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly permalinkRepository: PermalinkRepository,
    private readonly environmentService: EnvironmentService,
    private readonly presentationConfigurationService: PresentationConfigurationService,
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
    private readonly passportRepository: PassportRepository,
    private readonly envService: EnvService,
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
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

  @Get("/permalinks")
  async listByOrganization(
    @OrganizationId() organizationId: string,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
  ) {
    if (memberRole === undefined) {
      throw new ForbiddenException();
    }
    const pagination = Pagination.create({ limit, cursor });
    const { items, cursor: nextCursor } =
      await this.permalinkApplicationService.listByOrganization(organizationId, pagination);
    return PermalinkPaginationDtoSchema.parse({
      paging_metadata: { cursor: nextCursor },
      result: items.map(({ permalink, publicUrl, fallbackBaseUrl, fallbackBaseUrlSource }) => ({
        ...permalink.toPlain(),
        publicUrl,
        fallbackBaseUrl,
        fallbackBaseUrlSource,
      })),
    });
  }

  @Get("/passports/:id/permalinks")
  async listByPassport(
    @Param("id") id: string,
    @OrganizationId() organizationId: string,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
  ) {
    if (memberRole === undefined) {
      throw new ForbiddenException();
    }
    const passport = await this.passportRepository.findOne(id);
    if (!passport) {
      throw new NotFoundException(`Passport ${id} not found`);
    }
    if (passport.organizationId !== organizationId) {
      throw new ForbiddenException();
    }
    const pagination = Pagination.create({ limit, cursor });
    const { items, cursor: nextCursor } =
      await this.permalinkApplicationService.listByPassport(id, pagination);
    return PermalinkPaginationDtoSchema.parse({
      paging_metadata: { cursor: nextCursor },
      result: items.map(({ permalink, publicUrl, fallbackBaseUrl, fallbackBaseUrlSource }) => ({
        ...permalink.toPlain(),
        publicUrl,
        fallbackBaseUrl,
        fallbackBaseUrlSource,
      })),
    });
  }

  @Post("/permalinks")
  @HttpCode(HttpStatus.CREATED)
  async createPermalink(
    @OrganizationId() organizationId: string,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @Body(new ZodValidationPipe(PermalinkCreateRequestSchema))
    body: PermalinkCreateRequest,
  ) {
    if (memberRole === undefined) {
      throw new ForbiddenException();
    }

    // Resolve the owning passport and check ownership
    let passport: Passport;
    if (body.kind === PermalinkKind.GS1_LINK) {
      // gs1-link: look up UPI → use its referenceId to find the passport
      const upi = await this.uniqueProductIdentifierRepository.findOne(
        body.uniqueProductIdentifierId,
      );
      if (!upi) {
        throw new NotFoundException(
          `UniqueProductIdentifier ${body.uniqueProductIdentifierId} not found`,
        );
      }
      const found = await this.passportRepository.findOne(upi.referenceId);
      if (!found) {
        throw new NotFoundException(`Passport ${upi.referenceId} not found`);
      }
      passport = found;
    } else {
      // presentation: look up the config → use its referenceId to find the passport
      const config = await this.presentationConfigurationRepository.findOneOrFail(
        body.presentationConfigurationId,
      );
      const found = await this.passportRepository.findOne(config.referenceId);
      if (!found) {
        throw new NotFoundException(`Passport ${config.referenceId} not found`);
      }
      passport = found;
    }

    // Ownership check: the requester must belong to the passport's org
    if (passport.organizationId !== organizationId) {
      throw new ForbiddenException();
    }

    try {
      let created: Permalink;
      if (body.kind === PermalinkKind.GS1_LINK) {
        created = await this.permalinkApplicationService.createGs1LinkPermalink({
          uniqueProductIdentifierId: body.uniqueProductIdentifierId,
          presentationConfigurationId: body.presentationConfigurationId ?? null,
          gs1ResolverBase: body.gs1ResolverBase ?? null,
          gs1DataAttributes: body.gs1DataAttributes ?? null,
        });
      } else {
        const config = await this.presentationConfigurationRepository.findOneOrFail(
          body.presentationConfigurationId,
        );
        created = await this.permalinkApplicationService.createPresentationPermalink(
          passport,
          config,
        );
      }

      const branding = await this.resolveBranding(passport.organizationId);
      return PermalinkPublicDtoSchema.parse(await this.toPublicDto(created, branding, passport));
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  @Patch("/permalinks/:id")
  async updatePermalink(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(PermalinkUpdateRequestSchema))
    body: PermalinkUpdateRequest,
    @OrganizationId() organizationId: string,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ) {
    if (memberRole === undefined) {
      throw new ForbiddenException();
    }
    const permalink = await this.permalinkRepository.findOneOrFail(id);
    if (permalink.organizationId !== organizationId) {
      throw new ForbiddenException();
    }
    try {
      const update: {
        slug?: string | null;
        baseUrl?: string | null;
        gs1ResolverBase?: string | null;
        gs1DataAttributes?: Record<string, string> | null;
      } = {};
      if (body.slug !== undefined) update.slug = body.slug;
      if (body.baseUrl !== undefined) update.baseUrl = body.baseUrl;
      if (body.gs1ResolverBase !== undefined) update.gs1ResolverBase = body.gs1ResolverBase;
      if (body.gs1DataAttributes !== undefined) update.gs1DataAttributes = body.gs1DataAttributes;
      const next = await this.permalinkApplicationService.updatePermalink(id, update);
      const passport = await this.resolvePassportForPermalink(next);
      const branding = await this.resolveBranding(organizationId);
      return PermalinkPublicDtoSchema.parse(await this.toPublicDto(next, branding, passport));
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException("Slug is already taken");
      }
      if (
        error instanceof ValueError &&
        error.message.includes("Cannot modify a published permalink")
      ) {
        throw new ConflictException("Permalink is published and its slug/baseUrl are locked");
      }
      throw error;
    }
  }

  @Post("/permalinks/:id/primary")
  @HttpCode(HttpStatus.OK)
  async setPrimary(
    @Param("id") id: string,
    @OrganizationId() organizationId: string,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ) {
    if (memberRole === undefined) {
      throw new ForbiddenException();
    }
    const permalink = await this.permalinkRepository.findOneOrFail(id);
    if (permalink.organizationId !== organizationId) {
      throw new ForbiddenException();
    }
    const passport = await this.resolvePassportForPermalink(permalink);
    try {
      await this.environmentService.withTransaction(async (options) => {
        await this.permalinkApplicationService.setPrimary(passport.id, id, options);
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
    const updated = await this.permalinkRepository.findOneOrFail(id);
    const branding = await this.resolveBranding(organizationId);
    return PermalinkPublicDtoSchema.parse(await this.toPublicDto(updated, branding, passport));
  }

  @Delete("/permalinks/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePermalink(
    @Param("id") id: string,
    @OrganizationId() organizationId: string,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<void> {
    if (memberRole === undefined) {
      throw new ForbiddenException();
    }
    const permalink = await this.permalinkRepository.findOneOrFail(id);
    if (permalink.organizationId !== organizationId) {
      throw new ForbiddenException();
    }
    await this.permalinkApplicationService.deletePermalink(id);
  }

  private async resolvePassportForPermalink(permalink: Permalink): Promise<Passport> {
    if (
      permalink.kind === PermalinkKind.GS1_LINK &&
      permalink.uniqueProductIdentifierId !== null
    ) {
      const upi = await this.uniqueProductIdentifierRepository.findOne(
        permalink.uniqueProductIdentifierId,
      );
      if (!upi) {
        throw new NotFoundException(
          `UniqueProductIdentifier ${permalink.uniqueProductIdentifierId} not found`,
        );
      }
      const passport = await this.passportRepository.findOne(upi.referenceId);
      if (!passport) {
        throw new NotFoundException(`Passport ${upi.referenceId} not found`);
      }
      return passport;
    }
    if (permalink.presentationConfigurationId !== null) {
      const config = await this.presentationConfigurationRepository.findOneOrFail(
        permalink.presentationConfigurationId,
      );
      const passport = await this.passportRepository.findOne(config.referenceId);
      if (!passport) {
        throw new NotFoundException(`Passport ${config.referenceId} not found`);
      }
      return passport;
    }
    throw new NotFoundException(`Cannot resolve passport for permalink ${permalink.id}`);
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
