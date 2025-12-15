import { Cap } from "./cap";

export type QuotaPeriod = "year" | "month" | "day";

export interface QuotaCreateProps {
  key: string;
  limit: number;
  period: QuotaPeriod;
}

export type QuotaCreateDbProps = QuotaCreateProps & {
  count: number;
  lastSetBack: Date;
};

export class Quota extends Cap {
  private period: QuotaPeriod;
  private lastSetBack: Date;

  protected constructor(key: string, limit: number, count: number, period: QuotaPeriod, lastSetBack: Date) {
    super(key, limit, count);
    this.period = period;
    this.lastSetBack = lastSetBack;
  }

  static create(props: QuotaCreateProps) {
    return new Quota(props.key, props.limit, 0, props.period, new Date());
  }

  static loadFromDb(props: QuotaCreateDbProps) {
    return new Quota(props.key, props.limit, props.count, props.period, props.lastSetBack);
  }

  needsReset(): boolean {
    const currentDate = new Date();
    const sameYear = currentDate.getFullYear() === this.lastSetBack.getFullYear();
    const sameMonth = currentDate.getMonth() === this.lastSetBack.getMonth();
    const sameDay = currentDate.getDay() === this.lastSetBack.getDay();

    let result = false;

    switch (this.period) {
      case "day":
        result = result || !sameDay;
        // falls through
      case "month":
        result = result || !sameMonth;
        // falls through
      case "year":
        result = result || !sameYear;
        break;
      default:
    }

    return result;
  }

  isExceeded() {
    return this.count >= this.limit;
  }

  reset() {
    this.count = 0;
    this.lastSetBack = new Date();
  }

  getPeriod() {
    return this.period;
  }

  getLastReset() {
    return this.lastSetBack;
  }
}
