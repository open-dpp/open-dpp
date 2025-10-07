import { TraceabilityEvent } from "../../../domain/traceability-event";
import { TraceabilityEventType } from "../../../domain/traceability-event-type.enum";
import { TraceabilityEventWrapper } from "../../../domain/traceability-event-wrapper";

export class UntpEvent extends TraceabilityEvent {
  public readonly data: any;

  private constructor(data: any) {
    super(TraceabilityEventType.UNTP);
    this.data = data;
  }

  static create(data: {
    userId: string;
    itemId: string;
    organizationId: string;
    childData: any;
  }): TraceabilityEventWrapper<UntpEvent> {
    return TraceabilityEventWrapper.create({
      type: TraceabilityEventType.UNTP,
      ip: null,
      userId: data.userId,
      itemId: data.itemId,
      organizationId: data.organizationId,
      chargeId: null,
      geolocation: null,
      data: new UntpEvent(data.childData),
    });
  }
}
