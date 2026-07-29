import { Reflector } from "@nestjs/core";
import { ThrottlerStorageService } from "@nestjs/throttler";
import { UserOrIpThrottlerGuard } from "./user-or-ip.throttler-guard";

class TestableGuard extends UserOrIpThrottlerGuard {
  public getTrackerForTest(req: Record<string, unknown>): Promise<string> {
    return this.getTracker(req);
  }
}

describe("UserOrIpThrottlerGuard.getTracker", () => {
  let guard: TestableGuard;

  beforeEach(() => {
    guard = new TestableGuard(
      [{ name: "default", ttl: 60_000, limit: 1000 }],
      new ThrottlerStorageService(),
      new Reflector(),
    );
  });

  it("keys on the authenticated user id when a session is present", async () => {
    const req = {
      ip: "10.0.0.5",
      session: { userId: "user-123" },
    };

    const tracker = await guard.getTrackerForTest(req);

    expect(tracker).toContain("user-123");
    expect(tracker).not.toBe(await guard.getTrackerForTest({ ip: "10.0.0.5" }));
  });

  it("falls back to the client IP for anonymous requests", async () => {
    const req = { ip: "203.0.113.7", session: null };

    const tracker = await guard.getTrackerForTest(req);

    expect(tracker).toContain("203.0.113.7");
  });

  it("falls back to the client IP when no session field exists", async () => {
    const req = { ip: "203.0.113.42" };

    const tracker = await guard.getTrackerForTest(req);

    expect(tracker).toContain("203.0.113.42");
  });

  it("namespaces user buckets and ip buckets so they cannot collide", async () => {
    const userTracker = await guard.getTrackerForTest({
      ip: "1.2.3.4",
      session: { userId: "203.0.113.7" },
    });
    const ipTracker = await guard.getTrackerForTest({ ip: "203.0.113.7", session: null });

    expect(userTracker).not.toBe(ipTracker);
  });

  it("keys distinct authenticated users into distinct buckets", async () => {
    const trackerA = await guard.getTrackerForTest({ ip: "10.0.0.5", session: { userId: "a" } });
    const trackerB = await guard.getTrackerForTest({ ip: "10.0.0.5", session: { userId: "b" } });

    expect(trackerA).not.toBe(trackerB);
  });
});
