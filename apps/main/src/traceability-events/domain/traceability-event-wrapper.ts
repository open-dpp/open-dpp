import type { TraceabilityEvent } from "./traceability-event";
import type { TraceabilityEventType_TYPE } from "./traceability-event-type.enum";
import { randomUUID } from "node:crypto";

export class TraceabilityEventWrapper<T extends TraceabilityEvent> {
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly ip: string | null;
  public readonly userId: string | null;
  public readonly itemId: string | null;
  public readonly chargeId: string | null;
  public readonly organizationId: string | null;
  public readonly geolocation: {
    latitude: string;
    longitude: string;
  } | null;

  public readonly type: TraceabilityEventType_TYPE;
  public readonly data: T;

  private constructor(
    id: string,
    createdAt: Date,
    updatedAt: Date,
    ip: string | null,
    userId: string | null,
    itemId: string | null,
    chargeId: string | null,
    organizationId: string | null,
    geolocation: {
      latitude: string;
      longitude: string;
    } | null,
    type: TraceabilityEventType_TYPE,
    data: T,
  ) {
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.ip = ip;
    this.userId = userId;
    this.itemId = itemId;
    this.chargeId = chargeId;
    this.organizationId = organizationId;
    this.geolocation = geolocation;
    this.type = type;
    this.data = data;
  }

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
    type: TraceabilityEventType_TYPE;
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
    type: TraceabilityEventType_TYPE;
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
