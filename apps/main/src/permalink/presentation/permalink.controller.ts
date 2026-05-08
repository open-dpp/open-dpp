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
  Logger,
  Param,
  Patch,
  Query,
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
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { Permalink } from "../domain/permalink";
import { PermalinkRepository } from "../infrastructure/permalink.repository";
import {
  PermalinkApplicationService,
  isMemberOfPassportOrg,
  resolvePublicUrl,
} from "../application/services/permalink.application.service";

// Note: PermalinkController used to implement IAasReadEndpoints. The added
// access-context parameter (organizationId) for the draft-passport gate
// diverges the signatures from the canonical AAS read shape, so the marker
// interface no longer fits. The controller still exposes the same public
// surface; the implements clause is dropped to avoid forcing organizationId
// into IAasReadEndpoints (which would propagate into every other AAS
// controller).
@Controller()
export class PermalinkController {
  private readonly logger = new Logger(PermalinkController.name);

  constructor(
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly permalinkRepository: PermalinkRepository,
    private readonly environmentService: EnvironmentService,
    private readonly brandingRepository: BrandingRepository,
    private readonly presentationConfigurationService: PresentationConfigurationService,
    private readonly passportRepository: PassportRepository,
    private readonly envService: EnvService,
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
      // Lazy-backfill for pre-refactor passports that lack a config / permalink
      // row. Mirrors the legacy UPI redirect path so an admin can print a QR
      // for an old passport from the backoffice without manual migration.
      // Gate on owning-org membership so anonymous / cross-org traffic stays
      // on the read-only path (no DoS / no information leak).
      const passport = await this.passportRepository.findOne(passportId);
      if (!passport) {
        return PermalinkListDtoSchema.parse([]);
      }
      if (!isMemberOfPassportOrg(passport, { organizationId, memberRole })) {
        return PermalinkListDtoSchema.parse([]);
      }
      const created = await this.environmentService.withTransaction(async (options) => {
        return await this.permalinkApplicationService.ensureDefaultForPassport(passport, options);
      });
      this.logger.debug(
        `Lazy-backfilled permalink for backoffice passportId=${passport.id} → permalink=${created.id}`,
      );
      const branding = await this.loadBrandingOrDefault(passport.organizationId);
      return PermalinkListDtoSchema.parse([this.toPublicDto(created, branding)]);
    }
    // Hide non-published passports from anonymous / cross-org callers — same
    // gate as resolveToPassport so the listing endpoint can't enumerate
    // draft permalinks. Members of the owning org keep full visibility.
    const { passport } = await this.permalinkApplicationService.resolveToPassport(
      permalinks[0].id,
      {
        organizationId,
        memberRole,
      },
    );
    const branding = await this.loadBrandingOrDefault(passport.organizationId);
    return PermalinkListDtoSchema.parse(permalinks.map((p) => this.toPublicDto(p, branding)));
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
    const presentationConfiguration =
      await this.presentationConfigurationService.getEffectiveForPassport(passport, ability);
    const branding = await this.loadBrandingOrDefault(passport.organizationId);
    return PassportPermalinkBundleDtoSchema.parse({
      passport: passport.toPlain(),
      branding: branding.toPlain(),
      presentationConfiguration: presentationConfiguration.toPlain(),
      publicUrl: resolvePublicUrl(permalink, branding, this.envService.get("OPEN_DPP_URL")),
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

  // Authenticated partial update of a permalink. Permalink IDs are UUID-only
  // (slugs aren't accepted because slug→slug rename via slug lookup would
  // ambiguate the just-changed slug). Member-role on the owning passport's
  // organization is required. Body fields are independent: omit a field to
  // leave it untouched, send `null` to clear, send a value to set.
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
    // Pass the caller's access context so the draft-passport gate inside
    // `resolveToPassport` doesn't 404 a legitimate org member editing a
    // not-yet-published permalink. Cross-org callers still hit the
    // explicit organization check below.
    const { passport } = await this.permalinkApplicationService.resolveToPassport(id, {
      organizationId,
      memberRole,
    });
    if (passport.organizationId !== organizationId) {
      throw new ForbiddenException();
    }
    try {
      // Forward both fields verbatim — the service treats undefined as "skip"
      // and null as "clear", matching the `.nullish()` wire contract.
      const update: { slug?: string | null; baseUrl?: string | null } = {};
      if (body.slug !== undefined) update.slug = body.slug;
      if (body.baseUrl !== undefined) update.baseUrl = body.baseUrl;
      const next = await this.permalinkApplicationService.updatePermalink(id, update);
      const branding = await this.loadBrandingOrDefault(passport.organizationId);
      return PermalinkPublicDtoSchema.parse(this.toPublicDto(next, branding));
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException("Slug is already taken");
      }
      throw error;
    }
  }

  private async loadBrandingOrDefault(organizationId: string): Promise<Branding> {
    // Branding is non-essential display data: any lookup failure (missing
    // record, invalid org-id format, transient backend error) falls back to
    // the default rather than 500-ing the public bundle endpoint.
    try {
      return await this.brandingRepository.findOneByOrganizationId(organizationId);
    } catch {
      return Branding.getDefault();
    }
  }

  private toPublicDto(permalink: Permalink, branding: Branding | null) {
    return {
      ...permalink.toPlain(),
      publicUrl: resolvePublicUrl(permalink, branding, this.envService.get("OPEN_DPP_URL")),
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
