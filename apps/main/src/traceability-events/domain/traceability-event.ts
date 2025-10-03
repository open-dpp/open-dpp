import type { TraceabilityEventType_TYPE } from "./traceability-event-type.enum";

export abstract class TraceabilityEvent {
  type: TraceabilityEventType_TYPE;

  protected constructor(type: TraceabilityEventType_TYPE) {
    this.type = type;
  }
}
