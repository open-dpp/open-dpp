import { TimePeriod } from "../infrastructure/passport-metric.service";
import { MeasurementType } from "./passport-metric";
import { PassportMetricAggregation } from "./passport-metric-aggregation";

describe("passportMetricAggregation", () => {
  it("is create and return correct mongo query", () => {
    const props = {
      type: MeasurementType.PAGE_VIEWS,
      valueKey: "http://view",
      templateId: "t1",
      modelId: "m2",
      organizationId: "orga1",
      startDate: new Date("2025-01-03T12:00:00Z"),
      endDate: new Date("2025-01-07T12:00:00Z"),
    };
    const passportMetricAggregation = PassportMetricAggregation.create(props);
    expect(passportMetricAggregation.getFilterQuery()).toEqual([
      {
        $match: {
          "source.templateId": props.templateId,
          "source.modelId": props.modelId,
          "source.organizationId": props.organizationId,
          "source.type": props.type,
          "date": {
            $gte: props.startDate,
            $lte: props.endDate,
          },
        },
      },
    ]);

    expect(passportMetricAggregation.filterForLatestVersion()).toEqual([
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
    ]);

    expect(
      passportMetricAggregation.getAggregateQueryForTimePeriod(TimePeriod.DAY),
    ).toEqual([
      {
        $unwind: "$values",
      },
      {
        $match: {
          "values.key": "http://view",
        },
      },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$date",
              unit: "day",
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
    ]);
  });
});
