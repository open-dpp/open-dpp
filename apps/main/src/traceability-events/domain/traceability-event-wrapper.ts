import { randomUUID } from 'crypto';
import { TraceabilityEvent } from './traceability-event';
import { TraceabilityEventType } from './traceability-event-type.enum';

export class TraceabilityEventWrapper<T extends TraceabilityEvent> {
  private constructor(
    public readonly id: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly ip: string | null,
    public readonly userId: string | null,
    public readonly itemId: string | null,
    public readonly chargeId: string | null,
    public readonly organizationId: string | null,
    public readonly geolocation: {
      latitude: string;
      longitude: string;
    } | null,
    public readonly type: TraceabilityEventType,
    public readonly data: T,
  ) {}

  static create<T extends TraceabilityEvent>(data: {
    ip: string | null;
    userId: string;
    itemId: string;
    chargeId?: string | null | undefined;
    organizationId: string;
    geolocation?:
      | {
          latitude: string;
          longitude: string;
        }
      | null
      | undefined;
    type: TraceabilityEventType;
    data: T;
  }) {
    return new TraceabilityEventWrapper(
      randomUUID(),
      new Date(),
      new Date(),
      data.ip,
      data.userId,
      data.itemId,
      data.chargeId ?? null,
      data.organizationId,
      data.geolocation ?? null,
      data.type,
      data.data,
    );
  }

  static loadFromDb<T extends TraceabilityEvent>(payload: {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
    ip: string | null;
    userId: string | null;
    itemId: string | null;
    chargeId?: string | null | undefined;
    organizationId: string | null;
    geolocation?:
      | {
          latitude: string;
          longitude: string;
        }
      | null
      | undefined;
    type: TraceabilityEventType;
    data: T;
  }): TraceabilityEventWrapper<T> {
    return new TraceabilityEventWrapper(
      payload._id,
      payload.createdAt || new Date(),
      payload.updatedAt || new Date(),
      payload.ip,
      payload.userId,
      payload.itemId,
      payload.chargeId ?? null,
      payload.organizationId,
      payload.geolocation ?? null,
      payload.type,
      payload.data,
    );
  }
}
