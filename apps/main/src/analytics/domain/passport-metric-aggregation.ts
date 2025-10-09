import * as mongoose from "mongoose";
import { TimePeriod } from "../infrastructure/passport-metric.service";
import { MeasurementType } from "./passport-metric";

interface PassportMetricAggregationProps {
  type: MeasurementType;
  valueKey: string;
  templateId: string;
  modelId?: string;
  organizationId: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
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
    private readonly timezone: string,
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
      data.timezone,
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
              timezone: this.timezone,
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
        $densify: {
          field: "datetime",
          range: {
            step: 1,
            unit: timePeriod,
            bounds: [this.startDate, this.endDate],
          },
        },
      },
      {
        $set: {
          sum: {
            $ifNull: ["$sum", 0], // Fill missing values with 0
          },
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
