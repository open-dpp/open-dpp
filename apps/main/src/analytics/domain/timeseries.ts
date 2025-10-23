import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { TimePeriod } from "../infrastructure/passport-metric.service";

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
      start: string | Date;
      end: string | Date;
      step: number; // step size (e.g. 1 for 1 hour, 1 day, etc.)
      unit: TimePeriod;
      timezone?: string;
      fillValue?: number; // default 0
    },
  ): DataPoint[] {
    const { start, end, step, unit, timezone = "UTC", fillValue = 0 } = options;

    const startDate = dayjs(start, undefined, timezone);
    const endDate = dayjs(end, undefined, timezone);

    // Convert data to a map for fast lookup
    const dataMap = new Map<string, number>();
    for (const point of this.dataPoints) {
      const key = dayjs(point.datetime, undefined, timezone).startOf(unit).toISOString();
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
