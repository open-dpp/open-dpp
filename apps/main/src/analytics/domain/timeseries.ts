import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { TimePeriod } from "./time-period";

dayjs.extend(utc);
dayjs.extend(timezone);
interface DataPoint {
  datetime: string; // ISO string or compatible format
  sum: number;
}

export class Timeseries {
  private constructor(private dataPoints: DataPoint[]) {}

  static create(data: { dataPoints: DataPoint[] }): Timeseries {
    return new Timeseries(data.dataPoints);
  }

  densify(
    options: {
      startIsoString: string;
      endIsoString: string;
      step: number; // step size (e.g. 1 for 1 hour, 1 day, etc.)
      unit: TimePeriod;
      fillValue?: number; // default 0
    },
  ): DataPoint[] {
    const { startIsoString, endIsoString, step, unit, fillValue = 0 } = options;

    const startDate = dayjs.utc(startIsoString);
    const endDate = dayjs.utc(endIsoString);

    // Convert data to a map for fast lookup
    const dataMap = new Map<string, number>();
    for (const point of this.dataPoints) {
      // console.log(dayjs.tz(point.datetime, timezone).format());
      // console.log(dayjs.tz(point.datetime, timezone).startOf(unit).format(), dayjs.tz(point.datetime, timezone).startOf(unit).toISOString());
      const key = dayjs.utc(point.datetime).startOf(unit).toISOString();
      dataMap.set(key, point.sum);
    }

    const result: DataPoint[] = [];
    let current = startDate.startOf(unit);

    while (current.isBefore(endDate) || current.isSame(endDate)) {
      const key = current.toISOString();
      result.push({
        datetime: key,
        sum: dataMap.get(key) ?? fillValue,
      });
      current = current.add(step, unit);
    }

    return result;
  }
}
