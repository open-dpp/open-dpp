import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import {
  AssetAdministrationShellPaginationResponseDto,
  BrandingDto,
  BrandingDtoSchema,
  PassportDtoSchema,
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelResponseDto,
  ValueResponseDto,
} from "@open-dpp/dto";
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
  IdParam,
  IdShortPathParam,
  SubmodelIdParam,
} from "../../aas/presentation/aas.decorators";
import { IAasReadEndpoints } from "../../aas/presentation/aas.endpoints";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { BrandingRepository } from "../../branding/infrastructure/branding.repository";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OptionalAuth } from "../../identity/auth/presentation/decorators/optional-auth.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import { Pagination } from "../../pagination/pagination";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { UniqueProductIdentifierRepository } from "../infrastructure/unique-product-identifier.repository";
import { UniqueProductIdentifierListDtoSchema } from "./dto/unique-product-identifier-dto.schema";
import { UniqueProductIdentifierApplicationService } from "./unique.product.identifier.application.service";
import { LimitQueryParam } from "../../digital-product-document/presentation/digital-product-document-decorators";

@Controller()
export class UniqueProductIdentifierController implements IAasReadEndpoints {
  constructor(
    private readonly uniqueProductIdentifierApplicationService: UniqueProductIdentifierApplicationService,
    private readonly uniqueProductIdentifierService: UniqueProductIdentifierRepository,
    private readonly passportRepository: PassportRepository,
    private readonly environmentService: EnvironmentService,
    private readonly brandingRepository: BrandingRepository,
  ) {}

  @OptionalAuth()
  @Get("/unique-product-identifiers")
  async getUniqueProductIdentifierByReference(@Query("reference") reference: string) {
    if (!reference || reference.length === 0) {
      throw new NotFoundException();
    }

    const upids = await this.uniqueProductIdentifierService.findAllByReferencedId(reference);

    return UniqueProductIdentifierListDtoSchema.parse(upids);
  }

  @OptionalAuth()
  @Get("/unique-product-identifiers/:id/passport")
  async getReferencedPassport(@Param("id") id: string) {
    return PassportDtoSchema.parse(await this.loadPassport(id));
  }

  @OptionalAuth()
  @Get("/unique-product-identifiers/:id/branding")
  async getPassportBranding(@Param("id") id: string): Promise<BrandingDto> {
    const upiMetadata =
      await this.uniqueProductIdentifierApplicationService.getMetadataByUniqueProductIdentifier(id);

    if (!upiMetadata) {
      throw new BadRequestException();
    }

    return BrandingDtoSchema.parse(
      (await this.brandingRepository.findOneByOrganizationId(upiMetadata.organizationId)).toPlain(),
    );
  }

  @OptionalAuth()
  @ApiGetShells("unique-product-identifiers")
  async getShells(
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<AssetAdministrationShellPaginationResponseDto> {
    const passport = await this.loadPassport(id);
    const subject = SubjectAttributes.create({ userRole, memberRole });

    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(
      passport.getEnvironment(),
      pagination,
      subject,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodels("unique-product-identifiers")
  async getSubmodels(
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelPaginationResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassport(id);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(
      passport.getEnvironment(),
      pagination,
      subject,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodelById("unique-product-identifiers")
  async getSubmodelById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });

    const passport = await this.loadPassport(id);
    return await this.environmentService.getSubmodelById(
      passport.getEnvironment(),
      submodelId,
      subject,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodelValue("unique-product-identifiers")
  async getSubmodelValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<ValueResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassport(id);
    return await this.environmentService.getSubmodelValue(
      passport.getEnvironment(),
      submodelId,
      subject,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodelElements("unique-product-identifiers")
  async getSubmodelElements(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementPaginationResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassport(id);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodelElements(
      passport.getEnvironment(),
      submodelId,
      pagination,
      subject,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodelElementById("unique-product-identifiers")
  async getSubmodelElementById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassport(id);
    return await this.environmentService.getSubmodelElementById(
      passport.getEnvironment(),
      submodelId,
      idShortPath,
      subject,
    );
  }

  @OptionalAuth()
  @ApiGetSubmodelElementValue("unique-product-identifiers")
  async getSubmodelElementValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<ValueResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassport(id);
    return await this.environmentService.getSubmodelElementValue(
      passport.getEnvironment(),
      submodelId,
      idShortPath,
      subject,
    );
  }

  private async loadPassport(id: string): Promise<Passport> {
    const puid = await this.uniqueProductIdentifierService.findOneOrFail(id);
    return await this.passportRepository.findOneOrFail(puid.referenceId);
  }
}
