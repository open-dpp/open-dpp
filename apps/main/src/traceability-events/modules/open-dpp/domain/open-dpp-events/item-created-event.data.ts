import { OpenDppEventType } from '../open-dpp-event-type.enum';
import { OpenDppEventData } from '../open-dpp-event-data';
import { OpenDppEvent } from '../open-dpp-event';

export class ItemCreatedEventData extends OpenDppEventData {
  private constructor(public readonly itemId: string) {
    super();
    this.type = OpenDppEventType.ITEM_CREATED;
  }

  static createWithWrapper(data: {
    userId: string;
    itemId: string;
    organizationId: string;
  }) {
    return OpenDppEvent.createWithWrapper({
      userId: data.userId,
      itemId: data.itemId,
      organizationId: data.organizationId,
      childData: new ItemCreatedEventData(data.itemId),
    });
  }
}
