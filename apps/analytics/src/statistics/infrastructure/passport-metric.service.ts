import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model as MongooseModel } from 'mongoose';
import {
  PassportMetricDoc,
  PassportMetricSchemaVersion,
} from './passport-metric.schema';
import { MetricSourceProps, PassportMetric } from '../domain/passport-metric';
import { PassportMetricAggregation } from '../domain/passport-metric-aggregation';
import { NotFoundInDatabaseException } from '@app/exception/service.exceptions';

export enum TimePeriod {
  YEAR = 'year',
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
}

@Injectable()
export class PassportMetricService {
  constructor(
    @InjectModel(PassportMetricDoc.name)
    private passportMetricDoc: MongooseModel<PassportMetricDoc>,
  ) {}

  convertToDomain(passportMetricDoc: PassportMetricDoc) {
    return PassportMetric.loadFromDb({
      id: passportMetricDoc._id,
      source: passportMetricDoc.source,
      date: passportMetricDoc.date,
      values: passportMetricDoc.values.map((mv) => ({
        key: mv.key,
        value: mv.value,
        row: mv.row ?? null,
      })),
    });
  }

  async create(passportMetric: PassportMetric) {
    const data = {
      _id: passportMetric.id,
      source: {
        ...passportMetric.source,
      },
      date: passportMetric.date,
      _schemaVersion: PassportMetricSchemaVersion.v1_0_0,
      values: passportMetric.values.map((mv) => ({
        key: mv.key,
        value: mv.value,
        row: mv.row,
      })),
    };

    const dataModelDoc = await this.passportMetricDoc.insertOne(data);

    return this.convertToDomain(dataModelDoc);
  }

  async findByIdOrFail(id: string): Promise<PassportMetric> {
    const passportMetric = await this.passportMetricDoc.findById(id);
    if (!passportMetric) {
      throw new NotFoundInDatabaseException(PassportMetric.name);
    }
    return this.convertToDomain(passportMetric);
  }

  async findOneOrFail(
    source: MetricSourceProps,
    date: Date,
  ): Promise<PassportMetric> {
    const passportMetric = await this.findOne(source, date);
    if (!passportMetric) {
      throw new NotFoundInDatabaseException(PassportMetric.name);
    }
    return passportMetric;
  }

  async findOne(
    source: MetricSourceProps,
    date: Date,
  ): Promise<PassportMetric | undefined> {
    const passportMetricDocument = await this.passportMetricDoc.findOne({
      $expr: {
        $and: [
          { $eq: ['$date', date] },
          { $eq: ['$source.modelId', source.modelId] },
          { $eq: ['$source.organizationId', source.organizationId] },
          { $eq: ['$source.templateId', source.templateId] },
          { $eq: ['$source.type', source.type] },
        ],
      },
    });
    if (!passportMetricDocument) {
      return undefined;
    }
    return this.convertToDomain(passportMetricDocument);
  }

  async findAll(): Promise<PassportMetric[]> {
    const passportMetricDocuments = await this.passportMetricDoc.find();
    return passportMetricDocuments.map((passportMetricDocument) =>
      this.convertToDomain(passportMetricDocument),
    );
  }

  async computeStatistic(
    aggregation: PassportMetricAggregation,
    timePeriodToGroupBy: TimePeriod,
  ): Promise<{ datetime: string; sum: number }[]> {
    return this.passportMetricDoc.aggregate([
      ...aggregation.getFilterQuery(),
      ...aggregation.filterForLatestVersion(),
      ...aggregation.getAggregateQueryForTimePeriod(timePeriodToGroupBy),
    ]);
  }
}
