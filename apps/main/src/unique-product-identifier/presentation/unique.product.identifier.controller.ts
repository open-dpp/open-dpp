import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import {
  AssetAdministrationShellPaginationResponseDto,
  PassportDtoSchema,
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelResponseDto,
  ValueResponseDto,
} from "@open-dpp/dto";
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
import { AllowAnonymous } from "../../identity/auth/presentation/decorators/allow-anonymous.decorator";
import { AllowServiceAccess } from "../../identity/auth/presentation/decorators/allow-service-access.decorator";
import { ItemsService } from "../../items/infrastructure/items.service";
import { ModelsService } from "../../models/infrastructure/models.service";
import { Pagination } from "../../pagination/pagination";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { UniqueProductIdentifierService } from "../infrastructure/unique-product-identifier.service";
import {
  UniqueProductIdentifierListDtoSchema,
  UniqueProductIdentifierReferenceDtoSchema,
} from "./dto/unique-product-identifier-dto.schema";
import { UniqueProductIdentifierApplicationService } from "./unique.product.identifier.application.service";

@Controller()
export class UniqueProductIdentifierController implements IAasReadEndpoints {
  private readonly modelsService: ModelsService;
  private readonly uniqueProductIdentifierService: UniqueProductIdentifierService;
  private readonly itemService: ItemsService;
  private readonly uniqueProductIdentifierApplicationService: UniqueProductIdentifierApplicationService;
  private readonly environmentService: EnvironmentService;
  private readonly passportRepository: PassportRepository;

  constructor(
    modelsService: ModelsService,
    uniqueProductIdentifierService: UniqueProductIdentifierService,
    itemService: ItemsService,
    uniqueProductIdentifierApplicationService: UniqueProductIdentifierApplicationService,
    passportRepository: PassportRepository,
    environmentService: EnvironmentService,
  ) {
    this.modelsService = modelsService;
    this.uniqueProductIdentifierService = uniqueProductIdentifierService;
    this.itemService = itemService;
    this.uniqueProductIdentifierApplicationService = uniqueProductIdentifierApplicationService;
    this.passportRepository = passportRepository;
    this.environmentService = environmentService;
  }

  @Get("organizations/:orgaId/unique-product-identifiers/:id/reference")
  async getReferencedProductPassport(
    @Param("orgaId") organizationId: string,
    @Param("id") id: string,
  ) {
    const uniqueProductIdentifier
      = await this.uniqueProductIdentifierService.findOneOrFail(id);

    const item = await this.itemService.findOne(
      uniqueProductIdentifier.referenceId,
    );
    if (item) {
      return UniqueProductIdentifierReferenceDtoSchema.parse({
        id: item.id,
        organizationId: item.ownedByOrganizationId,
        modelId: item.modelId,
        granularityLevel: item.granularityLevel,
      });
    }
    const model = await this.modelsService.findOne(
      uniqueProductIdentifier.referenceId,
    );
    if (model) {
      return UniqueProductIdentifierReferenceDtoSchema.parse({
        id: model.id,
        organizationId: model.ownedByOrganizationId,
        granularityLevel: model.granularityLevel,
      });
    }
    const passport = await this.passportRepository.findOne(
      uniqueProductIdentifier.referenceId,
    );
    if (passport) {
      return UniqueProductIdentifierReferenceDtoSchema.parse({
        id: passport.id,
        organizationId: passport.organizationId,
      });
    }
  }

  @Get("organizations/:orgaId/unique-product-identifiers")
  async getUniqueProductIdentifierByReference(
    @Param("orgaId") organizationId: string,
    @Query("reference") reference: string,
  ) {
    if (!reference || reference.length === 0) {
      throw new NotFoundException();
    }

    const upids = await this.uniqueProductIdentifierService.findAllByReferencedId(reference);

    return UniqueProductIdentifierListDtoSchema.parse(upids);
  }

  @Get("organizations/:orgaId/unique-product-identifiers/:id/passport")
  async getReferencedPassport(
    @Param("orgaId") organizationId: string,
    @Param("id") id: string,
  ) {
    return PassportDtoSchema.parse((await this.loadPassport(id)));
  }

  @AllowServiceAccess()
  @Get("unique-product-identifiers/:id/metadata")
  async get(@Param("id") id: string) {
    return this.uniqueProductIdentifierApplicationService.getMetadataByUniqueProductIdentifier(
      id,
    );
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
    return await this.environmentService.getAasShells(passport.getEnvironment(), pagination);
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
