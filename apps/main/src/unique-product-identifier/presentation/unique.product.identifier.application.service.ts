import { Injectable } from '@nestjs/common';
import { UniqueProductIdentifierService } from '../infrastructure/unique-product-identifier.service';
import { UniqueProductIdentifierMetadataDtoSchema } from './dto/unique-product-identifier-dto.schema';
import { ModelsService } from '../../models/infrastructure/models.service';
import { ItemsService } from '../../items/infrastructure/items.service';

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
    const uniqueProductIdentifier =
      await this.uniqueProductIdentifierService.findOneOrFail(
        uniqueProductIdentifierId,
      );

    const item = await this.itemService.findOne(
      uniqueProductIdentifier.referenceId,
    );
    let organizationId;
    if (item) {
      organizationId = item.ownedByOrganizationId;
    } else {
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
