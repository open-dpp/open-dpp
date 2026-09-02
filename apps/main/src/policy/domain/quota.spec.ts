import { ValueError } from "@open-dpp/exception";
import { PolicyKeyList } from "./policy-rules";
import { Quota, QuotaPeriod } from "./quota";

describe("quota", () => {
  it("should reset if lastSetBack was 7 days ago (same day of week)", () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    const quota = Quota.loadFromDb({
      key: PolicyKeyList.AI_TOKEN_QUOTA,
      organizationId: "org1",
      limit: 100,
      count: 50,
      period: "day",
      lastSetBack: lastWeek,
    });

    expect(quota.needsReset()).toBe(true);
  });

  it("should not reset if lastSetBack is today", () => {
    const today = new Date();

    const quota = Quota.loadFromDb({
      key: PolicyKeyList.AI_TOKEN_QUOTA,
      organizationId: "org1",
      limit: 100,
      count: 50,
      period: "day",
      lastSetBack: today,
    });

    expect(quota.needsReset()).toBe(false);
  });

  it("should reset if lastSetBack is yesterday", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const quota = Quota.loadFromDb({
      key: PolicyKeyList.AI_TOKEN_QUOTA,
      organizationId: "org1",
      limit: 100,
      count: 50,
      period: "day",
      lastSetBack: yesterday,
    });

    expect(quota.needsReset()).toBe(true);
  });

  describe("getNextReset", () => {
    const quotaWith = (period: QuotaPeriod, lastSetBack: Date) =>
      Quota.loadFromDb({
        key: PolicyKeyList.AI_TOKEN_QUOTA,
        organizationId: "org1",
        limit: 100,
        count: 50,
        period,
        lastSetBack,
      });

    it("should return midnight of the following day for a daily quota", () => {
      const quota = quotaWith("day", new Date(2026, 8, 1, 13, 35, 56));

      expect(quota.getNextReset()).toEqual(new Date(2026, 8, 2, 0, 0, 0, 0));
    });

    it("should return the first of the following month for a monthly quota", () => {
      const quota = quotaWith("month", new Date(2026, 8, 15, 13, 35, 56));

      expect(quota.getNextReset()).toEqual(new Date(2026, 9, 1, 0, 0, 0, 0));
    });

    it("should not overflow when a monthly quota was last reset on a long month's end", () => {
      const quota = quotaWith("month", new Date(2026, 0, 31, 13, 35, 56));

      expect(quota.getNextReset()).toEqual(new Date(2026, 1, 1, 0, 0, 0, 0));
    });

    it("should return the first of the following year for a yearly quota", () => {
      const quota = quotaWith("year", new Date(2026, 8, 15, 13, 35, 56));

      expect(quota.getNextReset()).toEqual(new Date(2027, 0, 1, 0, 0, 0, 0));
    });

    it("should return a date in the future exactly when a reset is not yet due", () => {
      const quota = quotaWith("day", new Date());

      expect(quota.needsReset()).toBe(false);
      expect(quota.getNextReset().getTime()).toBeGreaterThan(Date.now());
    });
  });
});

describe("quota.withLimit", () => {
  const lastSetBack = new Date("2026-01-15T00:00:00.000Z");
  const quota = Quota.loadFromDb({
    key: PolicyKeyList.AI_TOKEN_QUOTA,
    organizationId: "org1",
    limit: 100,
    count: 50,
    period: "month",
    lastSetBack,
  });

  it("keeps the counter and period while changing the cap", () => {
    const updated = quota.withLimit(250);

    expect(updated.getLimit()).toBe(250);
    expect(updated.getCount()).toBe(50);
    expect(updated.getPeriod()).toBe("month");
    expect(updated.getLastReset()).toEqual(lastSetBack);
  });

  it("leaves the original untouched", () => {
    quota.withLimit(250);

    expect(quota.getLimit()).toBe(100);
  });

  it("rejects a negative cap", () => {
    expect(() => quota.withLimit(-1)).toThrow(ValueError);
  });

  it("rejects a fractional cap", () => {
    expect(() => quota.withLimit(1.5)).toThrow(ValueError);
  });
});
