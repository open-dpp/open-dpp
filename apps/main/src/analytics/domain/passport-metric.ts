import { v7 as uuid7 } from "uuid";

export interface MetricSourceProps {
  type: MeasurementType;
  passportId: string;
  templateId: string | null;
  organizationId: string;
}

export interface PassportMetricCreateProps {
  source: MetricSourceProps;
  date: Date;
}

export type PassportMetricDbProps = PassportMetricCreateProps & {
  id: string;
  values: MetricValue[];
};

export enum MeasurementType {
  PAGE_VIEWS = "PageViews",
  FIELD_AGGREGATE = "FieldAggregate",
}

export interface MetricValue {
  key: string;
  row: number | null;
  value: number;
}

export class PassportMetric {
  private constructor(
    public readonly id: string, // id must be sortable by date to make versioning pattern work (see https://medium.com/mongodb/versioning-pattern-with-time-series-data-in-mongodb-595b5e8cdac4)
    public readonly source: MetricSourceProps,
    public readonly date: Date,
    public readonly values: MetricValue[],
  ) {}

  static create(data: PassportMetricCreateProps): PassportMetric {
    return new PassportMetric(uuid7(), data.source, data.date, []);
  }

  static createPageView(data: {
    source: Omit<MetricSourceProps, "type">;
    page: string;
    date: Date;
  }) {
    const metric = PassportMetric.create({
      source: { ...data.source, type: MeasurementType.PAGE_VIEWS },
      date: data.date,
    });
    const url = new URL(data.page);
    metric.upsertMetricValue({ key: data.page, row: null, value: 1 });
    metric.upsertMetricValue({
      key: `${url.protocol}//${url.hostname}`,
      row: null,
      value: 1,
    });

    return metric;
  }

  static loadFromDb(data: PassportMetricDbProps): PassportMetric {
    return new PassportMetric(data.id, data.source, data.date, data.values);
  }

  upsertMetricValue(metricValue: MetricValue) {
    const foundMetric = this.values.find(
      mv => mv.key === metricValue.key && mv.row === metricValue.row,
    );
    if (foundMetric) {
      foundMetric.value = metricValue.value;
    }
    else {
      this.values.push(metricValue);
    }
  }
}
