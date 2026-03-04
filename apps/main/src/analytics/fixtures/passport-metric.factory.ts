import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { v7 as uuidv7 } from "uuid";
import {
  MeasurementType,
  PassportMetricCreateProps,
  PassportMetricDbProps,
} from "../domain/passport-metric";

export const nowDate = new Date("2025-01-01T12:00:00Z");

export const passportMetricCreateFactory
  = Factory.define<PassportMetricCreateProps>(() => ({
    source: {
      passportId: randomUUID(),
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
      passportId: randomUUID(),
      type: MeasurementType.PAGE_VIEWS,
      templateId: randomUUID(),
      organizationId: randomUUID(),
    },
    date: nowDate,
    values: [],
  }),
);
