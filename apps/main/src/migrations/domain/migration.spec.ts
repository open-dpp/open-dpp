import { describe, expect, it } from "vitest";
import { Migration, planMigrations } from "./migration";

const migration = (id: string): Migration => ({ id, up: async () => undefined });
const ids = (migrations: Migration[]) => migrations.map((m) => m.id);

describe("planMigrations", () => {
  it("plans every migration in id order for a fresh database", () => {
    const plan = planMigrations(
      [migration("20260102000000-second"), migration("20260101000000-first")],
      [],
    );

    expect(ids(plan.pending)).toEqual(["20260101000000-first", "20260102000000-second"]);
    expect(plan.unknownAppliedIds).toEqual([]);
    expect(plan.outOfOrderIds).toEqual([]);
  });

  it("skips applied migrations", () => {
    const plan = planMigrations(
      [migration("20260101000000-first"), migration("20260102000000-second")],
      ["20260101000000-first"],
    );

    expect(ids(plan.pending)).toEqual(["20260102000000-second"]);
    expect(plan.outOfOrderIds).toEqual([]);
  });

  it("reports applied ids the app does not know", () => {
    const plan = planMigrations(
      [migration("20260101000000-first")],
      ["20260101000000-first", "20260105000000-from-newer-version"],
    );

    expect(plan.pending).toEqual([]);
    expect(plan.unknownAppliedIds).toEqual(["20260105000000-from-newer-version"]);
  });

  it("reports pending migrations older than the newest applied one", () => {
    const plan = planMigrations(
      [
        migration("20260101000000-merged-late"),
        migration("20260102000000-applied"),
        migration("20260103000000-new"),
      ],
      ["20260102000000-applied"],
    );

    expect(ids(plan.pending)).toEqual(["20260101000000-merged-late", "20260103000000-new"]);
    expect(plan.outOfOrderIds).toEqual(["20260101000000-merged-late"]);
  });

  it("compares against unknown applied ids too", () => {
    const plan = planMigrations(
      [migration("20260101000000-first")],
      ["20260105000000-from-newer-version"],
    );

    expect(plan.outOfOrderIds).toEqual(["20260101000000-first"]);
  });
});
