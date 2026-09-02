import { Policy, PolicyCreateProps } from "./policy";
import { PolicyKey } from "./policy-rules";

export type QuotaPeriod = "year" | "month" | "day";

export type QuotaCreateProps = PolicyCreateProps & {
  period: QuotaPeriod;
};

export type QuotaCreateDbProps = QuotaCreateProps & {
  count: number;
  lastSetBack: Date;
};

export class Quota extends Policy {
  private period: QuotaPeriod;
  private count: number;
  private lastSetBack: Date;

  protected constructor(
    key: PolicyKey,
    limit: number,
    organizationId: string,
    count: number,
    period: QuotaPeriod,
    lastSetBack: Date,
  ) {
    super(key, limit, organizationId);
    this.count = count;
    this.period = period;
    this.lastSetBack = lastSetBack;
  }

  static create(props: QuotaCreateProps) {
    return new Quota(props.key, props.limit, props.organizationId, 0, props.period, new Date());
  }

  static loadFromDb(props: QuotaCreateDbProps) {
    return new Quota(
      props.key,
      props.limit,
      props.organizationId,
      props.count,
      props.period,
      props.lastSetBack,
    );
  }

  withLimit(limit: number): Quota {
    Quota.assertValidLimit(limit);

    return new Quota(
      this.getKey(),
      limit,
      this.getOrganizationId(),
      this.count,
      this.period,
      this.lastSetBack,
    );
  }

  needsReset(): boolean {
    const currentDate = new Date();
    const sameYear = currentDate.getFullYear() === this.lastSetBack.getFullYear();
    const sameMonth = currentDate.getMonth() === this.lastSetBack.getMonth();
    const sameDay = sameYear && sameMonth && currentDate.getDate() === this.lastSetBack.getDate();

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

  increment(amount: number = 1): void {
    this.count += amount;
  }

  getCount() {
    return this.count;
  }

  getLastReset() {
    return this.lastSetBack;
  }

  getNextReset(): Date {
    const nextReset = new Date(this.lastSetBack);
    nextReset.setHours(0, 0, 0, 0);

    switch (this.period) {
      case "day":
        nextReset.setDate(nextReset.getDate() + 1);
        break;
      case "month":
        nextReset.setDate(1);
        nextReset.setMonth(nextReset.getMonth() + 1);
        break;
      case "year":
        nextReset.setMonth(0, 1);
        nextReset.setFullYear(nextReset.getFullYear() + 1);
        break;
    }

    return nextReset;
  }
}
