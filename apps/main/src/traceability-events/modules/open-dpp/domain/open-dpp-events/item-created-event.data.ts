import { OpenDppEvent } from '../open-dpp-event'
import { OpenDppEventData } from '../open-dpp-event-data'
import { OpenDppEventType } from '../open-dpp-event-type.enum'

export class ItemCreatedEventData extends OpenDppEventData {
  public readonly itemId: string

  private constructor(itemId: string) {
    super()
    this.type = OpenDppEventType.ITEM_CREATED
    this.itemId = itemId
  }

  static createWithWrapper(data: {
    userId: string
    itemId: string
    organizationId: string
  }) {
    return OpenDppEvent.createWithWrapper({
      userId: data.userId,
      itemId: data.itemId,
      organizationId: data.organizationId,
      childData: new ItemCreatedEventData(data.itemId),
    })
  }
}
