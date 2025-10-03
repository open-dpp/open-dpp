import type { PermissionService } from "@open-dpp/auth";
import type * as authRequest from "@open-dpp/auth";
import type { ItemsService } from "../../items/infrastructure/items.service";
import type { ModelsService } from "../../models/infrastructure/models.service";
import type { UniqueProductIdentifierService } from "../infrastructure/unique-product-identifier.service";
import { Controller, Get, Param, Request } from "@nestjs/common";
import { AllowServiceAccess } from "@open-dpp/auth";
import {
  UniqueProductIdentifierMetadataDtoSchema,
  UniqueProductIdentifierReferenceDtoSchema,
} from "./dto/unique-product-identifier-dto.schema";

@Controller()
export class UniqueProductIdentifierController {
  private readonly modelsService: ModelsService;
  private readonly uniqueProductIdentifierService: UniqueProductIdentifierService;
  private readonly itemService: ItemsService;
  private readonly permissionsService: PermissionService;

  constructor(
    modelsService: ModelsService,
    uniqueProductIdentifierService: UniqueProductIdentifierService,
    itemService: ItemsService,
    permissionsService: PermissionService,
  ) {
    this.modelsService = modelsService;
    this.uniqueProductIdentifierService = uniqueProductIdentifierService;
    this.itemService = itemService;
    this.permissionsService = permissionsService;
  }

  @Get("organizations/:orgaId/unique-product-identifiers/:id/reference")
  async getReferencedProductPassport(
    @Param("orgaId") organizationId: string,
    @Param("id") id: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
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
    const uniqueProductIdentifier
      = await this.uniqueProductIdentifierService.findOneOrFail(id);

    const item = await this.itemService.findOne(
      uniqueProductIdentifier.referenceId,
    );
    let organizationId;
    if (item) {
      organizationId = item.ownedByOrganizationId;
    }
    else {
      const model = await this.modelsService.findOneOrFail(
        uniqueProductIdentifier.referenceId,
      );
      organizationId = model.ownedByOrganizationId;
    }
    return UniqueProductIdentifierMetadataDtoSchema.parse({
      organizationId,
    });
  }
}
