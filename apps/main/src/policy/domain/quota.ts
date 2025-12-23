import { Cap } from "./cap";
import { PolicyKey } from "./policy";

export type QuotaPeriod = "year" | "month" | "day";

export interface QuotaCreateProps {
  key: PolicyKey;
  organizationId: string;
  limit: number;
  period: QuotaPeriod;
}

export type QuotaCreateDbProps = QuotaCreateProps & {
  count: number;
  lastSetBack: Date;
};

export class Quota extends Cap {
  private period: QuotaPeriod;
  private count: number;
  private lastSetBack: Date;

  protected constructor(key: PolicyKey, limit: number, organizationId: string, count: number, period: QuotaPeriod, lastSetBack: Date) {
    super(key, limit, organizationId);
    this.count = count;
    this.period = period;
    this.lastSetBack = lastSetBack;
  }

  static create(props: QuotaCreateProps) {
    return new Quota(props.key, props.limit, props.organizationId, 0, props.period, new Date());
  }

  static loadFromDb(props: QuotaCreateDbProps) {
    return new Quota(props.key, props.limit, props.organizationId, props.count, props.period, props.lastSetBack);
  }

  needsReset(): boolean {
    const currentDate = new Date();
    const sameYear = currentDate.getFullYear() === this.lastSetBack.getFullYear();
    const sameMonth = currentDate.getMonth() === this.lastSetBack.getMonth();
    const sameDay
      = currentDate.getFullYear() === this.lastSetBack.getFullYear()
        && currentDate.getMonth() === this.lastSetBack.getMonth()
        && currentDate.getDate() === this.lastSetBack.getDate();

    switch (this.period) {
      case "day":
        return !sameDay;
      case "month":
        return !sameYear || !sameMonth;
      case "year":
        return !sameYear;
      default:
        return false;
    }
  }

  isExceeded() {
    return this.count >= this.getLimit();
  }

  reset() {
    this.count = 0;
    this.lastSetBack = new Date();
  }

  getPeriod() {
    return this.period;
  }

  increase(amount: number) {
    this.count += amount;
  }

  getCount() {
    return this.count;
  }

  getLastReset() {
    return this.lastSetBack;
  }
}
