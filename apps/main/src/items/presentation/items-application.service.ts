import type { ModelsService } from '../../models/infrastructure/models.service'
import type { TemplateService } from '../../templates/infrastructure/template.service'
import type { TraceabilityEventsService } from '../../traceability-events/infrastructure/traceability-events.service'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { ItemCreatedEventData } from '../../traceability-events/modules/open-dpp/domain/open-dpp-events/item-created-event.data'
import { UniqueProductIdentifierCreatedEventData } from '../../traceability-events/modules/open-dpp/domain/open-dpp-events/unique-product-identifier-created-event.data'
import { Item } from '../domain/item'

@Injectable()
export class ItemsApplicationService {
  constructor(
    private readonly modelsService: ModelsService,
    private readonly templateService: TemplateService,
    private readonly traceabilityEventsService: TraceabilityEventsService,
  ) {}

  async createItem(
    organizationId: string,
    modelId: string,
    userId: string,
    externalUUID?: string,
  ) {
    const model = await this.modelsService.findOneOrFail(modelId)
    if (!model.isOwnedBy(organizationId)) {
      throw new ForbiddenException()
    }
    const template = model.templateId
      ? await this.templateService.findOneOrFail(model.templateId)
      : undefined
    if (!template) {
      throw new ForbiddenException()
    }

    const item = Item.create({
      organizationId,
      userId,
      template,
      model,
    })

    item.createUniqueProductIdentifier(externalUUID)

    await this.traceabilityEventsService.create(
      ItemCreatedEventData.createWithWrapper({
        itemId: item.id,
        userId,
        organizationId,
      }),
    )
    for (const uniqueProductIdentifier of item.uniqueProductIdentifiers) {
      await this.traceabilityEventsService.create(
        UniqueProductIdentifierCreatedEventData.createWithWrapper({
          itemId: item.id,
          userId,
          organizationId,
          uniqueProductIdentifierId: uniqueProductIdentifier.uuid,
        }),
      )
    }
    return item
  }
}
