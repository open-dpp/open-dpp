import { expect } from "@jest/globals";
import dayjs from "dayjs";
import { TimePeriod } from "../infrastructure/passport-metric.service";
import { Timeseries } from "./timeseries";

describe("timeseries", () => {
  it("should densify", () => {
    const dataPoints = [
      {
        sum: 4,
        datetime: "2025-07-31T22:00:00.000Z",
      },
      {
        sum: 22,
        datetime: "2025-08-31T22:00:00.000Z",
      },
      {
        sum: 6,
        datetime: "2025-10-31T23:00:00.000Z",
      },
    ];
    const timeseries = Timeseries.create({ dataPoints });
    const start = dayjs().startOf("year").toISOString();
    const end = dayjs().endOf("year").toISOString();
    const result = timeseries.densify({
      start,
      end,
      step: 1,
      unit: TimePeriod.MONTH,
      timezone: "Europe/Berlin",
    });
    expect(result).toEqual([
      {
        datetime: "2024-12-31T23:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-01-31T23:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-02-28T23:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-03-31T22:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-04-30T22:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-05-31T22:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-06-30T22:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-07-31T22:00:00.000Z",
        sum: 4,
      },
      {
        datetime: "2025-08-31T22:00:00.000Z",
        sum: 22,
      },
      {
        datetime: "2025-09-30T22:00:00.000Z",
        sum: 0,
      },
      {
        datetime: "2025-10-31T23:00:00.000Z",
        sum: 6,
      },
      {
        datetime: "2025-11-30T23:00:00.000Z",
        sum: 0,
      },
    ]);
  });
});
