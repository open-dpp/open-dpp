import { OpenDppEventType } from '../open-dpp-event-type.enum';
import { OpenDppEventData } from '../open-dpp-event-data';
import { OpenDppEvent } from '../open-dpp-event';

export class UniqueProductIdentifierCreatedEventData extends OpenDppEventData {
  private constructor(public readonly uniqueProductIdentifierId: string) {
    super();
    this.type = OpenDppEventType.UNIQUE_PRODUCT_IDENTIFIER_CREATED;
  }

  static createWithWrapper(data: {
    userId: string;
    itemId: string;
    organizationId: string;
    uniqueProductIdentifierId: string;
  }) {
    return OpenDppEvent.createWithWrapper({
      userId: data.userId,
      itemId: data.itemId,
      organizationId: data.organizationId,
      childData: new UniqueProductIdentifierCreatedEventData(
        data.uniqueProductIdentifierId,
      ),
    });
  }
}
