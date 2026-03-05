import { Injectable } from "@nestjs/common";
import { ItemsService } from "../../items/infrastructure/items.service";
import { ModelsService } from "../../models/infrastructure/models.service";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { UniqueProductIdentifierService } from "../infrastructure/unique-product-identifier.service";
import {
  UniqueProductIdentifierMetadataDtoSchema,
  UniqueProductIdentifierMetadataOldDtoSchema,
} from "./dto/unique-product-identifier-dto.schema";

@Injectable()
export class UniqueProductIdentifierApplicationService {
  constructor(
    private readonly modelsService: ModelsService,
    private readonly uniqueProductIdentifierService: UniqueProductIdentifierService,
    private readonly itemService: ItemsService,
    private readonly passportRepository: PassportRepository,
  ) {}

  async getMetadataByUniqueProductIdentifierOld(
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

    return UniqueProductIdentifierMetadataOldDtoSchema.parse({
      organizationId: model.ownedByOrganizationId,
      passportId: item?.id ?? model.id,
      modelId: model.id,
      templateId: model.templateId,
    });
  }

  async getMetadataByUniqueProductIdentifier(
    uniqueProductIdentifierId: string,
  ) {
    const uniqueProductIdentifier
      = await this.uniqueProductIdentifierService.findOneOrFail(
        uniqueProductIdentifierId,
      );
    const passport = await this.passportRepository.findOneOrFail(uniqueProductIdentifier.referenceId);

    return UniqueProductIdentifierMetadataDtoSchema.parse({
      organizationId: passport.organizationId,
      passportId: passport.id,
      templateId: passport.templateId,
    });
  }
}
