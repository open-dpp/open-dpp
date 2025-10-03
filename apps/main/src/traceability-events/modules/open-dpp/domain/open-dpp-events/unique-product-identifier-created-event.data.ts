import { OpenDppEvent } from '../open-dpp-event'
import { OpenDppEventData } from '../open-dpp-event-data'
import { OpenDppEventType } from '../open-dpp-event-type.enum'

export class UniqueProductIdentifierCreatedEventData extends OpenDppEventData {
  public readonly uniqueProductIdentifierId: string

  private constructor(uniqueProductIdentifierId: string) {
    super()
    this.type = OpenDppEventType.UNIQUE_PRODUCT_IDENTIFIER_CREATED
    this.uniqueProductIdentifierId = uniqueProductIdentifierId
  }

  static createWithWrapper(data: {
    userId: string
    itemId: string
    organizationId: string
    uniqueProductIdentifierId: string
  }) {
    return OpenDppEvent.createWithWrapper({
      userId: data.userId,
      itemId: data.itemId,
      organizationId: data.organizationId,
      childData: new UniqueProductIdentifierCreatedEventData(
        data.uniqueProductIdentifierId,
      ),
    })
  }
}
