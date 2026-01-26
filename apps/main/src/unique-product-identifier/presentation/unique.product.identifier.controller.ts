import { Controller, Get, Param } from "@nestjs/common";
import { AllowServiceAccess } from "../../identity/auth/allow-service-access.decorator";
import { ItemsService } from "../../items/infrastructure/items.service";
import { ModelsService } from "../../models/infrastructure/models.service";
import { UniqueProductIdentifierService } from "../infrastructure/unique-product-identifier.service";
import {
  UniqueProductIdentifierReferenceDtoSchema,
} from "./dto/unique-product-identifier-dto.schema";
import { UniqueProductIdentifierApplicationService } from "./unique.product.identifier.application.service";

@Controller()
export class UniqueProductIdentifierController {
  private readonly modelsService: ModelsService;
  private readonly uniqueProductIdentifierService: UniqueProductIdentifierService;
  private readonly itemService: ItemsService;
  private readonly uniqueProductIdentifierApplicationService: UniqueProductIdentifierApplicationService;

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
}
