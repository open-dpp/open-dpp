import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
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
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { IdShortPath } from "../../aas/domain/submodel-base/submodel-base";
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
  LimitQueryParam,
  SubmodelIdParam,
} from "../../aas/presentation/aas.decorators";
import { IAasReadEndpoints } from "../../aas/presentation/aas.endpoints";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { BrandingRepository } from "../../branding/infrastructure/branding.repository";
import { AllowAnonymous } from "../../identity/auth/presentation/decorators/allow-anonymous.decorator";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { Pagination } from "../../pagination/pagination";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { UniqueProductIdentifierService } from "../infrastructure/unique-product-identifier.service";
import {
  UniqueProductIdentifierListDtoSchema,
} from "./dto/unique-product-identifier-dto.schema";
import { UniqueProductIdentifierApplicationService } from "./unique.product.identifier.application.service";

@Controller()
export class UniqueProductIdentifierController implements IAasReadEndpoints {
  constructor(
    private readonly uniqueProductIdentifierApplicationService: UniqueProductIdentifierApplicationService,
    private readonly uniqueProductIdentifierService: UniqueProductIdentifierService,
    private readonly passportRepository: PassportRepository,
    private readonly environmentService: EnvironmentService,
    private readonly brandingRepository: BrandingRepository,
  ) {
  }

  @AllowAnonymous()
  @Get("/unique-product-identifiers")
  async getUniqueProductIdentifierByReference(
    @Query("reference") reference: string,
  ) {
    if (!reference || reference.length === 0) {
      throw new NotFoundException();
    }

    const upids = await this.uniqueProductIdentifierService.findAllByReferencedId(reference);

    return UniqueProductIdentifierListDtoSchema.parse(upids);
  }

  @AllowAnonymous()
  @Get("/unique-product-identifiers/:id/passport")
  async getReferencedPassport(
    @Param("id") id: string,
  ) {
    return PassportDtoSchema.parse((await this.loadPassport(id)));
  }

  @AllowAnonymous()
  @Get("/unique-product-identifiers/:id/branding")
  async getPassportBranding(
    @Param("id") id: string,
  ): Promise<BrandingDto> {
    const upiMetadata = await this.uniqueProductIdentifierApplicationService.getMetadataByUniqueProductIdentifier(id);

    if (!upiMetadata) {
      throw new BadRequestException();
    }

    return BrandingDtoSchema.parse((await this.brandingRepository.findOneByOrganizationId(upiMetadata.organizationId)).toPlain());
  }

  @AllowAnonymous()
  @ApiGetShells("unique-product-identifiers")
  async getShells(
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
  ): Promise<AssetAdministrationShellPaginationResponseDto> {
    const passport = await this.loadPassport(id);

    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(passport.getEnvironment(), pagination, SubjectAttributes.create({ userRole: UserRole.ANONYMOUS }));
  }

  @AllowAnonymous()
  @ApiGetSubmodels("unique-product-identifiers")
  async getSubmodels(
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
  ): Promise<SubmodelPaginationResponseDto> {
    const passport = await this.loadPassport(id);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(passport.getEnvironment(), pagination);
  }

  @AllowAnonymous()
  @ApiGetSubmodelById("unique-product-identifiers")
  async getSubmodelById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
  ): Promise<SubmodelResponseDto> {
    const passport = await this.loadPassport(id);
    return await this.environmentService.getSubmodelById(passport.getEnvironment(), submodelId);
  }

  @AllowAnonymous()
  @ApiGetSubmodelValue("unique-product-identifiers")
  async getSubmodelValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
  ): Promise<ValueResponseDto> {
    const passport = await this.loadPassport(id);
    return await this.environmentService.getSubmodelValue(passport.getEnvironment(), submodelId);
  }

  @AllowAnonymous()
  @ApiGetSubmodelElements("unique-product-identifiers")
  async getSubmodelElements(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
  ): Promise<SubmodelElementPaginationResponseDto> {
    const passport = await this.loadPassport(id);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodelElements(passport.getEnvironment(), submodelId, pagination);
  }

  @AllowAnonymous()
  @ApiGetSubmodelElementById("unique-product-identifiers")
  async getSubmodelElementById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassport(id);
    return await this.environmentService.getSubmodelElementById(passport.getEnvironment(), submodelId, idShortPath);
  }

  @AllowAnonymous()
  @ApiGetSubmodelElementValue("unique-product-identifiers")
  async getSubmodelElementValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
  ): Promise<ValueResponseDto> {
    const passport = await this.loadPassport(id);
    return await this.environmentService.getSubmodelElementValue(passport.getEnvironment(), submodelId, idShortPath);
  }

  private async loadPassport(id: string): Promise<Passport> {
    const puid = await this.uniqueProductIdentifierService.findOneOrFail(id);
    return await this.passportRepository.findOneOrFail(puid.referenceId);
  }
}
