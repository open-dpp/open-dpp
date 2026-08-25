export enum MeasurementType {
  PAGE_VIEWS = "PageViews",
  FIELD_AGGREGATE = "FieldAggregate",
}

export enum TimePeriod {
  YEAR = "year",
  MONTH = "month",
  WEEK = "week",
  DAY = "day",
  HOUR = "hour",
}

export interface PassportMeasurementDto {
  datetime: string;
  sum: number;
}

export interface PassportMetricQueryDto {
  startDate: Date;
  endDate: Date;
  templateId?: string;
  passportId: string;
  type: MeasurementType;
  valueKey: string;
  period: string;
}

import type { PassportPageViewDto } from "@open-dpp/dto";

export type PageViewCreateDto = PassportPageViewDto;

export interface PageViewDto {
  id: string;
}
