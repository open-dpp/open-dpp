import { randomUUID } from 'crypto';
import { Factory } from 'fishery';
import {
  FieldValue,
  MeasurementType,
  PassportMetricCreateProps,
  PassportMetricDbProps,
} from '../domain/passport-metric';
import { v7 as uuidv7 } from 'uuid';
export const nowDate = new Date('2025-01-01T12:00:00Z');

export const passportMetricCreateFactory =
  Factory.define<PassportMetricCreateProps>(() => ({
    source: {
      modelId: randomUUID(),
      type: MeasurementType.PAGE_VIEWS,
      templateId: randomUUID(),
      organizationId: randomUUID(),
    },
    date: nowDate,
  }));

export const passportMetricFactory = Factory.define<PassportMetricDbProps>(
  () => ({
    id: uuidv7(),
    source: {
      modelId: randomUUID(),
      type: MeasurementType.PAGE_VIEWS,
      templateId: randomUUID(),
      organizationId: randomUUID(),
    },
    date: nowDate,
    values: [],
  }),
);

export const dataFieldFactory = Factory.define<FieldValue>(() => {
  return {
    value: 3,
    dataSectionId: randomUUID(),
    dataFieldId: randomUUID(),
    row: 0,
  };
});
