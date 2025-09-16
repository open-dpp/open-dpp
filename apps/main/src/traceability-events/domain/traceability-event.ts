import { TraceabilityEventType } from './traceability-event-type.enum';

export abstract class TraceabilityEvent {
  type: TraceabilityEventType;

  protected constructor(type: TraceabilityEventType) {
    this.type = type;
  }
}
