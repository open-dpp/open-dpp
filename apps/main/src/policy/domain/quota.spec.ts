import { PolicyKey } from "./policy";
import { Quota } from "./quota";

describe("quota", () => {
  it("should reset if lastSetBack was 7 days ago (same day of week)", () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    const quota = Quota.loadFromDb({
      key: PolicyKey.AI_TOKEN_QUOTA,
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
      key: PolicyKey.AI_TOKEN_QUOTA,
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
      key: PolicyKey.AI_TOKEN_QUOTA,
      organizationId: "org1",
      limit: 100,
      count: 50,
      period: "day",
      lastSetBack: yesterday,
    });

    expect(quota.needsReset()).toBe(true);
  });
});
