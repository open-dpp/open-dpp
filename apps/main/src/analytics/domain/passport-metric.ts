import { v7 as uuid7 } from "uuid";
import { z } from "zod/v4";

export interface MetricSourceProps {
  type: MeasurementType;
  modelId: string;
  templateId: string;
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

export interface FieldValue {
  value: unknown;
  dataSectionId: string;
  dataFieldId: string;
  row: number;
}

export interface FieldAggregateCreateProps {
  source: Omit<MetricSourceProps, "type">;
  fieldValues: FieldValue[];
  date: Date;
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

  static createFieldAggregate(data: FieldAggregateCreateProps): PassportMetric {
    const metric = PassportMetric.create({
      source: { ...data.source, type: MeasurementType.FIELD_AGGREGATE },
      date: data.date,
    });
    data.fieldValues.forEach((fieldValue) => {
      if (z.number().safeParse(fieldValue.value).success) {
        metric.upsertMetricValue({
          key: fieldValue.dataFieldId,
          row: fieldValue.row,
          value: Number(fieldValue.value),
        });
      }
    });
    return metric;
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
