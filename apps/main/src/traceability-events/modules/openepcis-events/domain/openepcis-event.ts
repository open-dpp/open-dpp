import { TraceabilityEventType } from '../../../domain/traceability-event-type.enum';
import { TraceabilityEvent } from '../../../domain/traceability-event';
import { TraceabilityEventWrapper } from '../../../domain/traceability-event-wrapper';

export class OpenEpcisEvent extends TraceabilityEvent {
  private constructor(public readonly data: any) {
    super(TraceabilityEventType.OPENEPCIS);
    this.data = data;
  }

  static create(data: {
    userId: string;
    itemId: string;
    organizationId: string;
    childData: any;
  }): TraceabilityEventWrapper<OpenEpcisEvent> {
    return TraceabilityEventWrapper.create({
      type: TraceabilityEventType.OPENEPCIS,
      ip: null,
      userId: data.userId,
      itemId: data.itemId,
      organizationId: data.organizationId,
      chargeId: null,
      geolocation: null,
      data: new OpenEpcisEvent(data.childData),
    });
  }
}
