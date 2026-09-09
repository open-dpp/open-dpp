import { describe, expect, it } from "vitest";
import { hardProblems, loadConformance } from "./load";
import { RunSchema, RunsFileSchema } from "./schema-runs";

const run = {
  id: "2026-09-20-espr",
  date: "2026-09-20",
  trigger: { kind: "text", detail: "first assessment" },
  commit: "d5f8219e",
  sources: ["ESPR"],
  scope: [{ id: "ESPR-Art9(1)", reason: "text change" }],
  validator: "agent:conformance-review",
  reviewer: "pending",
};

describe("the committed files", () => {
  it("carry no schema or cross-reference problems (an open run's pending reviewer is not one)", () => {
    const { data, problems } = loadConformance();
    // hardProblems drops the reviewer-of-record gate; a live matrix in review still has none of the
    // fatal (schema, unknown-id, copyright) problems the site build refuses to render.
    expect(hardProblems(problems)).toEqual([]);
    expect(data.standards.map((s) => s.standard)).toEqual([
      "BATT",
      "CPR",
      "DET",
      "ESPR",
      "REG1778",
      "TOYS",
    ]);
    expect(data.watch?.cellar.seen.length).toBeGreaterThan(0);
  });

  it("keeps the reviewer-of-record gate as a soft problem", () => {
    const { problems } = loadConformance();
    const pending = problems.filter((p) => p.code === "pending-reviewer");
    // matrix:check fails on it; the site build ignores it. Present while the BATT run is in review.
    expect(pending.every((p) => hardProblems([p]).length === 0)).toBe(true);
  });
});

describe("run schema", () => {
  it("accepts a run entry and rejects malformed ids and duplicates", () => {
    expect(RunSchema.parse(run).reviewer).toBe("pending");
    expect(RunSchema.safeParse({ ...run, id: "espr-2026" }).success).toBe(false);
    expect(RunsFileSchema.safeParse({ runs: [run, run] }).success).toBe(false);
  });
});
