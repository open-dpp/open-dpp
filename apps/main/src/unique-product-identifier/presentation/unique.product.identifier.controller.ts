import { Controller, ForbiddenException, Get, Param } from "@nestjs/common";
import { hasPermission, PermissionAction } from "@open-dpp/permission";
import { AllowServiceAccess } from "../../auth/allow-service-access.decorator";
import { UserSession } from "../../auth/auth.guard";
import { Session } from "../../auth/session.decorator";
import { ItemsService } from "../../items/infrastructure/items.service";
import { ModelsService } from "../../models/infrastructure/models.service";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
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
  private readonly organizationsService: OrganizationsService;

  constructor(
    modelsService: ModelsService,
    uniqueProductIdentifierService: UniqueProductIdentifierService,
    itemService: ItemsService,
    uniqueProductIdentifierApplicationService: UniqueProductIdentifierApplicationService,
    organizationsService: OrganizationsService,
  ) {
    this.modelsService = modelsService;
    this.uniqueProductIdentifierService = uniqueProductIdentifierService;
    this.itemService = itemService;
    this.uniqueProductIdentifierApplicationService = uniqueProductIdentifierApplicationService;
    this.organizationsService = organizationsService;
  }

  @Get("organizations/:orgaId/unique-product-identifiers/:id/reference")
  async getReferencedProductPassport(
    @Param("orgaId") organizationId: string,
    @Param("id") id: string,
    @Session() session: UserSession,
  ) {
    const organization = await this.organizationsService.findOneOrFail(organizationId);
    if (!hasPermission({
      user: {
        id: session.user.id,
      },
    }, PermissionAction.READ, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }
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
