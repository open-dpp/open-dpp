import { Injectable } from "@nestjs/common";
import { ItemsService } from "../../items/infrastructure/items.service";
import { ModelsService } from "../../models/infrastructure/models.service";
import { UniqueProductIdentifierService } from "../infrastructure/unique-product-identifier.service";
import { UniqueProductIdentifierMetadataDtoSchema } from "./dto/unique-product-identifier-dto.schema";

@Injectable()
export class UniqueProductIdentifierApplicationService {
  constructor(
    private readonly modelsService: ModelsService,
    private readonly uniqueProductIdentifierService: UniqueProductIdentifierService,
    private readonly itemService: ItemsService,
  ) {}

  async getMetadataByUniqueProductIdentifier(
    uniqueProductIdentifierId: string,
  ) {
    const uniqueProductIdentifier
      = await this.uniqueProductIdentifierService.findOneOrFail(
        uniqueProductIdentifierId,
      );

    const item = await this.itemService.findOne(
      uniqueProductIdentifier.referenceId,
    );
    const modelId = item?.modelId ?? uniqueProductIdentifier.referenceId;
    const model = await this.modelsService.findOneOrFail(modelId);

    return UniqueProductIdentifierMetadataDtoSchema.parse({
      organizationId: model.ownedByOrganizationId,
      passportId: item?.id ?? model.id,
      modelId: model.id,
      templateId: model.templateId,
    });
  }
}
