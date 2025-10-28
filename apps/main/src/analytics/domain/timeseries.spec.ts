import { expect } from "@jest/globals";
import { TimePeriod } from "./time-period";
import { Timeseries } from "./timeseries";

describe("timeseries", () => {
  it("should densify", () => {
    const dataPoints = [
      {
        sum: 2,
        datetime: "2025-02-01T00:00:00.000Z",
      },
      {
        sum: 4,
        datetime: "2025-08-01T00:00:00.000Z",
      },
      {
        sum: 22,
        datetime: "2025-09-01T00:00:00.000Z",
      },
      {
        sum: 6,
        datetime: "2025-11-01T00:00:00.000Z",
      },
    ];

    const timeseries = Timeseries.create({ dataPoints });
    const start = "2025-01-01T00:00:00.000Z";
    const end = "2025-12-31T23:59:59.999Z";

    const result = timeseries.densify({
      startIsoString: start,
      endIsoString: end,
      step: 1,
      unit: TimePeriod.MONTH,
    });
    expect(result).toEqual([
      {
        datetime: "2025-01-01T00:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-02-01T00:00:00.000Z",
        sum: 2,
      },
      {
        datetime: "2025-03-01T00:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-04-01T00:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-05-01T00:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-06-01T00:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-07-01T00:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-08-01T00:00:00.000Z",
        sum: 4,
      },
      {
        datetime: "2025-09-01T00:00:00.000Z",
        sum: 22,
      },
      {
        datetime: "2025-10-01T00:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-11-01T00:00:00.000Z",
        sum: 6,
      },
      {
        datetime: "2025-12-01T00:00:00.000Z",
        sum: 0,
      },
    ]);
  });
});
