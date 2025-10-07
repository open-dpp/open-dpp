export enum MeasurementType {
  PAGE_VIEWS = 'PageViews',
  FIELD_AGGREGATE = 'FieldAggregate',
}

export enum TimePeriod {
  YEAR = 'year',
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
}

export interface PassportMeasurementDto {
  datetime: string
  sum: number
}

export interface PassportMetricQueryDto {
  startDate: Date
  endDate: Date
  templateId: string
  modelId: string
  type: MeasurementType
  valueKey: string
  period: string
}

export interface PageViewCreateDto {
  uuid: string
  page: string
}

export interface PageViewDto {
  id: string
}
