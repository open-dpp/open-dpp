import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import type {
  ApiVersionsDtoType,
  AssetAdministrationShellPaginationResponseDto,
  PassportPermalinkBundleDto,
  PermalinkCreateRequest,
  PermalinkUpdateRequest,
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelResponseDto,
  ValueResponseDto,
} from "@open-dpp/dto";
import {
  AllApiVersions,
  PassportPermalinkBundleDtoSchema,
  PermalinkCreateRequestSchema,
  PermalinkKind,
  PermalinkListDtoSchema,
  PermalinkPaginationDtoSchema,
  PermalinkPublicDtoSchema,
  PermalinkUpdateRequestSchema,
  DigitalProductDocumentTypes,
  UniqueProductIdentifierType,
} from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { ValueError, ZodValidationPipe } from "@open-dpp/exception";
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
  PassportIdQueryParam,
  SubmodelIdParam,
} from "../../aas/presentation/aas.decorators";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { isDuplicateKeyError } from "../../lib/mongo-errors";
import type { Session } from "../../identity/auth/domain/session";
import { AuthSession } from "../../identity/auth/presentation/decorators/auth-session.decorator";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OptionalAuth } from "../../identity/auth/presentation/decorators/optional-auth.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import { Pagination } from "../../pagination/pagination";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { Permalink } from "../domain/permalink";
import { PermalinkRepository } from "../infrastructure/permalink.repository";
import {
  PermalinkApplicationService,
  type PermalinkUpdate,
} from "../application/services/permalink.application.service";
import {
  BaseUrlResolver,
  resolveFallbackBaseUrl,
} from "../application/services/base-url-resolver.service";
import { LimitQueryParam } from "../../digital-product-document/presentation/digital-product-document-decorators";
import { UniqueProductIdentifierRepository } from "../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import { ApiVersion } from "../../common/decorators/api-version.decorator";

@Controller({ version: AllApiVersions })
export class PermalinkController {
  private readonly logger = new Logger(PermalinkController.name);

  constructor(
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly baseUrlResolver: BaseUrlResolver,
    private readonly permalinkRepository: PermalinkRepository,
    private readonly environmentService: EnvironmentService,
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
    private readonly passportRepository: PassportRepository,
    private readonly envService: EnvService,
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
  ) {}

  @OptionalAuth()
  @Get("/p")
  async getByPassport(
    @PassportIdQueryParam() passportId: string,
    @AuthSession() session: Session | undefined,
  ) {
    const passport = await this.passportRepository.findOne(passportId);
    const isMember = passport
      ? await this.permalinkApplicationService.isMemberOfPassportOrg(passport, {
          userId: session?.userId,
        })
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
    @AuthSession() session: Session | undefined,
  ): Promise<PassportPermalinkBundleDto> {
    const { permalink, passport, presentationConfiguration } =
      await this.permalinkApplicationService.resolveToPassport(id, {
        userId: session?.userId,
      });
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
      presentationConfiguration: presentationConfiguration?.toPlain() ?? null,
      publicUrl,
    });
  }

  @Patch("/p/:id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(PermalinkUpdateRequestSchema))
    body: PermalinkUpdateRequest,
    @OrganizationId() organizationId: string,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @AuthSession() session: Session | undefined,
  ) {
    if (memberRole === undefined) {
      throw new ForbiddenException();
    }
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      userId: session?.userId,
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
    const forPin = await this.baseUrlResolver.loadBrandingOrNull(organizationId);
    return { display: forPin ?? Branding.getDefault(), forPin };
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
    const { items, cursor: nextCursor } = await this.permalinkApplicationService.listByOrganization(
      organizationId,
      pagination,
    );
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
    const { items, cursor: nextCursor } = await this.permalinkApplicationService.listByPassport(
      id,
      pagination,
    );
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

    const passport = await this.passportRepository.findOne(body.passportId);
    if (!passport) {
      throw new NotFoundException(`Passport ${body.passportId} not found`);
    }
    if (passport.organizationId !== organizationId) {
      throw new ForbiddenException();
    }
    const presentationConfigurationId = await this.validateConfigRef(
      body.presentationConfigurationId ?? null,
      passport,
      organizationId,
    );

    let created: Permalink;
    if (body.kind === PermalinkKind.GS1_LINK) {
      await this.validateUpiRef(body.uniqueProductIdentifierId, passport, [
        UniqueProductIdentifierType.GS1,
      ]);
      created = await this.permalinkApplicationService.createGs1LinkPermalink({
        passportId: passport.id,
        uniqueProductIdentifierId: body.uniqueProductIdentifierId,
        organizationId: passport.organizationId,
        presentationConfigurationId,
        gs1DataAttributes: body.gs1DataAttributes ?? null,
        slug: body.slug ?? null,
        baseUrl: body.baseUrl ?? null,
      });
    } else {
      if (body.uniqueProductIdentifierId != null) {
        await this.validateUpiRef(body.uniqueProductIdentifierId, passport, [
          UniqueProductIdentifierType.OPEN_DPP_UUID,
        ]);
      }
      created = await this.permalinkApplicationService.createOpenDppPermalink({
        passportId: passport.id,
        organizationId: passport.organizationId,
        presentationConfigurationId,
        uniqueProductIdentifierId: body.uniqueProductIdentifierId ?? null,
        slug: body.slug ?? null,
        baseUrl: body.baseUrl ?? null,
      });
    }

    const branding = await this.resolveBranding(passport.organizationId);
    return PermalinkPublicDtoSchema.parse(await this.toPublicDto(created, branding, passport));
  }

  private async validateConfigRef(
    presentationConfigurationId: string | null,
    passport: Passport,
    organizationId: string,
  ): Promise<string | null> {
    if (presentationConfigurationId == null) {
      return null;
    }
    const config = await this.presentationConfigurationRepository.findOne(
      presentationConfigurationId,
    );
    if (!config) {
      throw new NotFoundException(
        `PresentationConfiguration ${presentationConfigurationId} not found`,
      );
    }
    if (config.organizationId !== organizationId) {
      throw new ForbiddenException();
    }
    if (
      config.referenceType !== DigitalProductDocumentTypes.Passport ||
      config.referenceId !== passport.id
    ) {
      throw new BadRequestException(
        `PresentationConfiguration ${presentationConfigurationId} does not belong to passport ${passport.id}`,
      );
    }
    return config.id;
  }

  private async validateUpiRef(
    uniqueProductIdentifierId: string,
    passport: Passport,
    allowedTypes: readonly string[],
  ): Promise<void> {
    const upi = await this.uniqueProductIdentifierRepository.findOne(uniqueProductIdentifierId);
    if (!upi) {
      throw new NotFoundException(`UniqueProductIdentifier ${uniqueProductIdentifierId} not found`);
    }
    if (upi.referenceId !== passport.id) {
      throw new BadRequestException(
        `UniqueProductIdentifier ${upi.uuid} does not belong to passport ${passport.id}`,
      );
    }
    if (!allowedTypes.includes(upi.type)) {
      throw new BadRequestException(
        `UniqueProductIdentifier ${upi.uuid} is of type ${upi.type} and cannot back this permalink kind`,
      );
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
    const passport = await this.resolvePassportForPermalink(permalink);
    try {
      const update: PermalinkUpdate = {};
      if (body.slug !== undefined) update.slug = body.slug;
      if (body.baseUrl !== undefined) update.baseUrl = body.baseUrl;
      if (body.gs1DataAttributes !== undefined) update.gs1DataAttributes = body.gs1DataAttributes;
      if (body.presentationConfigurationId !== undefined) {
        update.presentationConfigurationId = await this.validateConfigRef(
          body.presentationConfigurationId ?? null,
          passport,
          organizationId,
        );
      }
      const next = await this.permalinkApplicationService.updatePermalink(id, update);
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
        throw new ConflictException(
          "Permalink is published and its slug/baseUrl/configuration are locked",
        );
      }
      throw error;
    }
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
    const passport = await this.passportRepository.findOne(permalink.passportId);
    if (!passport) {
      throw new NotFoundException(`Passport ${permalink.passportId} not found`);
    }
    return passport;
  }

  @OptionalAuth()
  @ApiGetShells("p")
  async getShells(
    @IdOrSlugParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @AuthSession() session: Session | undefined,
  ): Promise<AssetAdministrationShellPaginationResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      userId: session?.userId,
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
    @AuthSession() session: Session | undefined,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelPaginationResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      userId: session?.userId,
    });
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(
      passport.getEnvironment(),
      pagination,
      subject,
      version,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodelById("p")
  async getSubmodelById(
    @IdOrSlugParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @AuthSession() session: Session | undefined,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      userId: session?.userId,
    });
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.environmentService.getSubmodelById(
      passport.getEnvironment(),
      submodelId,
      subject,
      version,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodelValue("p")
  async getSubmodelValue(
    @IdOrSlugParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @AuthSession() session: Session | undefined,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<ValueResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      userId: session?.userId,
    });
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.environmentService.getSubmodelValue(
      passport.getEnvironment(),
      submodelId,
      subject,
      version,
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
    @AuthSession() session: Session | undefined,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementPaginationResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      userId: session?.userId,
    });
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodelElements(
      passport.getEnvironment(),
      submodelId,
      pagination,
      subject,
      version,
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
    @AuthSession() session: Session | undefined,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      userId: session?.userId,
    });
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.environmentService.getSubmodelElementById(
      passport.getEnvironment(),
      submodelId,
      idShortPath,
      subject,
      version,
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
    @AuthSession() session: Session | undefined,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<ValueResponseDto> {
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      userId: session?.userId,
    });
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.environmentService.getSubmodelElementValue(
      passport.getEnvironment(),
      submodelId,
      idShortPath,
      subject,
      version,
    );
  }
}
