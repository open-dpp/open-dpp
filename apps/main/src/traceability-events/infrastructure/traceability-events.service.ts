import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TraceabilityEventDocument } from './traceability-event.document';
import { TraceabilityEventWrapper } from '../domain/traceability-event-wrapper';
import { TraceabilityEventType } from '../domain/traceability-event-type.enum';
import { TraceabilityEvent } from '../domain/traceability-event';

@Injectable()
export class TraceabilityEventsService {
  constructor(
    @InjectModel(TraceabilityEventDocument.name)
    private traceabilityEventDocument: Model<TraceabilityEventDocument>,
  ) {}

  async create<T extends TraceabilityEvent>(
    dppEvent: TraceabilityEventWrapper<T>,
  ) {
    const newTraceabilityEvent = await this.traceabilityEventDocument.create({
      _id: dppEvent.id,
      createdAt: dppEvent.createdAt,
      updatedAt: new Date(), // Always set updatedAt to current time when creating a new event
      ip: dppEvent.ip,
      data: dppEvent.data,
      userId: dppEvent.userId,
      itemId: dppEvent.itemId,
      chargeId: dppEvent.chargeId,
      organizationId: dppEvent.organizationId,
      geolocation: dppEvent.geolocation,
      type: dppEvent.type,
    });
    return TraceabilityEventWrapper.loadFromDb<T>({
      _id: newTraceabilityEvent.id,
      createdAt: newTraceabilityEvent.createdAt,
      updatedAt: newTraceabilityEvent.updatedAt,
      ip: newTraceabilityEvent.ip,
      userId: newTraceabilityEvent.userId,
      itemId: newTraceabilityEvent.itemId,
      chargeId: newTraceabilityEvent.chargeId,
      organizationId: newTraceabilityEvent.organizationId,
      geolocation: newTraceabilityEvent.geolocation,
      type: newTraceabilityEvent.type,
      data: newTraceabilityEvent.data as T,
    });
  }

  async findById(id: string) {
    const foundDocs = await this.traceabilityEventDocument
      .find(
        { _id: id },
        {
          _id: true,
          data: true,
          createdAt: true,
          updatedAt: true,
        },
      )
      .exec();
    return foundDocs.map((dm) => TraceabilityEventWrapper.loadFromDb(dm));
  }

  async findByDataType(type: TraceabilityEventType) {
    const foundData = await this.traceabilityEventDocument
      .find({
        'data.type': type,
      })
      .exec();
    return foundData.map((dm) => TraceabilityEventWrapper.loadFromDb(dm));
  }
}
