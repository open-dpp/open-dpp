import { Controller, Get, Param } from "@nestjs/common";
import {
  AssetAdministrationShellPaginationResponseDto,
  SubmodelElementPaginationResponseDto,
  SubmodelElementRequestDto,
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
  ApiPostSubmodelElementAtIdShortPath,
  CursorQueryParam,
  IdParam,
  IdShortPathParam,
  LimitQueryParam,
  SubmodelElementRequestBody,
  SubmodelIdParam,
} from "../../aas/presentation/aas.decorators";
import { IAasReadEndpoints } from "../../aas/presentation/aas.endpoints";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { AllowServiceAccess } from "../../identity/auth/presentation/decorators/allow-service-access.decorator";
import { ItemsService } from "../../items/infrastructure/items.service";
import { ModelsService } from "../../models/infrastructure/models.service";
import { Pagination } from "../../pagination/pagination";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { UniqueProductIdentifierService } from "../infrastructure/unique-product-identifier.service";
import {
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
  ) {
    this.modelsService = modelsService;
    this.uniqueProductIdentifierService = uniqueProductIdentifierService;
    this.itemService = itemService;
    this.uniqueProductIdentifierApplicationService = uniqueProductIdentifierApplicationService;
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
    else {
      const model = await this.modelsService.findOneOrFail(
        uniqueProductIdentifier.referenceId,
      );
      return UniqueProductIdentifierReferenceDtoSchema.parse({
        id: model.id,
        organizationId: model.ownedByOrganizationId,
        granularityLevel: model.granularityLevel,
      });
    }
  }

  @AllowServiceAccess()
  @Get("unique-product-identifiers/:id/metadata")
  async get(@Param("id") id: string) {
    return this.uniqueProductIdentifierApplicationService.getMetadataByUniqueProductIdentifier(
      id,
    );
  }

  @ApiGetShells()
  async getShells(
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
  ): Promise<AssetAdministrationShellPaginationResponseDto> {
    const passport = await this.loadPassport(id);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(passport.getEnvironment(), pagination);
  }

  @ApiGetSubmodels()
  async getSubmodels(
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
  ): Promise<SubmodelPaginationResponseDto> {
    const passport = await this.loadPassport(id);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(passport.getEnvironment(), pagination);
  }

  @ApiGetSubmodelById()
  async getSubmodelById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
  ): Promise<SubmodelResponseDto> {
    const passport = await this.loadPassport(id);
    return await this.environmentService.getSubmodelById(passport.getEnvironment(), submodelId);
  }

  @ApiGetSubmodelValue()
  async getSubmodelValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
  ): Promise<ValueResponseDto> {
    const passport = await this.loadPassport(id);
    return await this.environmentService.getSubmodelValue(passport.getEnvironment(), submodelId);
  }

  @ApiGetSubmodelElements()
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

  @ApiGetSubmodelElementById()
  async getSubmodelElementById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassport(id);
    return await this.environmentService.getSubmodelElementById(passport.getEnvironment(), submodelId, idShortPath);
  }

  @ApiPostSubmodelElementAtIdShortPath()
  async createSubmodelElementAtIdShortPath(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassport(id);
    return await this.environmentService.addSubmodelElement(passport.getEnvironment(), submodelId, body, idShortPath);
  }

  @ApiGetSubmodelElementValue()
  async getSubmodelElementValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
  ): Promise<ValueResponseDto> {
    const passport = await this.loadPassport(id);
    return await this.environmentService.getSubmodelElementValue(passport.getEnvironment(), submodelId, idShortPath);
  }

  private async loadPassport(id: string): Promise<Passport> {
    const passport = await this.passportRepository.findOneOrFail(id);
    return passport;
  }
}
