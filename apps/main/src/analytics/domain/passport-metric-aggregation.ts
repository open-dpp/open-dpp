import * as mongoose from "mongoose";
import { MeasurementType } from "./passport-metric";
import { TimePeriod } from "./time-period";

interface PassportMetricAggregationProps {
  type: MeasurementType;
  valueKey: string;
  templateId: string;
  modelId?: string;
  organizationId: string;
  startDate: Date;
  endDate: Date;
}

export class PassportMetricAggregation {
  private constructor(
    private readonly type: MeasurementType,
    public readonly valueKey: string,
    private readonly templateId: string,
    private readonly modelId: string | null,
    private readonly organizationId: string,
    private readonly startDate: Date,
    private readonly endDate: Date,
  ) {}

  static create(
    data: PassportMetricAggregationProps,
  ): PassportMetricAggregation {
    return new PassportMetricAggregation(
      data.type,
      data.valueKey,
      data.templateId,
      data.modelId ?? null,
      data.organizationId,
      data.startDate,
      data.endDate,
    );
  }

  getFilterQuery(): mongoose.PipelineStage[] {
    const matchStage: { [key: string]: any } = {
      "source.type": this.type,
      "source.organizationId": this.organizationId,
      "source.templateId": this.templateId,
    };

    if (this.modelId) {
      matchStage["source.modelId"] = this.modelId;
    }

    matchStage.date = {};
    if (this.startDate) {
      matchStage.date.$gte = this.startDate;
    }
    if (this.endDate) {
      matchStage.date.$lte = this.endDate;
    }

    return [
      {
        $match: matchStage,
      },
    ];
  }

  /**
   * Taken from versioning pattern with timeseries blog article at https://medium.com/mongodb/versioning-pattern-with-time-series-data-in-mongodb-595b5e8cdac4
   */
  filterForLatestVersion(): mongoose.PipelineStage[] {
    return [
      {
        $sort: {
          source: 1,
          date: 1,
          _id: -1,
        },
      },
      {
        $group: {
          _id: {
            source: "$source",
            date: "$date",
          },
          latestDocument: {
            $first: "$$ROOT",
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$latestDocument",
        },
      },
    ];
  }

  getAggregateQueryForTimePeriod(
    timePeriod: TimePeriod,
  ): mongoose.PipelineStage[] {
    const matchKey = {
      "values.key": this.valueKey,
    };
    return [
      {
        $unwind: "$values",
      },
      {
        $match: matchKey,
      },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$date",
              unit: timePeriod,
            },
          },
          sum: {
            $sum: "$values.value",
          },
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          datetime: "$_id", // Create a new field 'date' with the value of _id
          sum: 1, // Keep the sum field
        },
      },
      {
        $sort: {
          datetime: 1,
        },
      },
    ];
  }
}
