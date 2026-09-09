import { describe, expect, it } from "vitest";
import { type ChangedFiles, computeScope, countReasons, evidencePaths, sourcesOf } from "./scope";
import { assessment, criterion, standard } from "./spec-fixtures";

const nothingChanged: ChangedFiles = () => [];
const changed =
  (files: string[]): ChangedFiles =>
  (_from, _to, paths) =>
    files.filter((f) => paths.some((p) => f.startsWith(p)));

const espr = standard("ESPR", [
  criterion("ESPR-Art12(1)", { operationalisedBy: ["EN18219"] }),
  criterion("ESPR-Art9(1)"),
]);
const en = standard("EN18219", [
  criterion("EN18219-5.1", { assessment: assessment("Met", ["apps/main/src/a.ts"]) }),
  criterion("EN18219-5.2", { assessment: assessment("Gap", ["apps/main/src/b.ts"]) }),
  criterion("EN18219-5.3"),
  criterion("EN18219-4.9", { retiredIn: "EN 18219:2027" }),
  criterion("EN18219-6.1", {
    assessment: {
      ...assessment("Met"),
      evidence: [{ type: "check", ref: "gs1-resolver", result: "passed", date: "2026-09-01" }],
    },
  }),
]);
const standards = [espr, en];

describe("computeScope", () => {
  it("text change touches the text and the law rows it operationalises, never retired ones", () => {
    const scope = computeScope(standards, { kind: "text", sources: ["EN18219"] }, nothingChanged);
    expect(scope.map((e) => e.id)).toEqual([
      "ESPR-Art12(1)",
      "EN18219-5.1",
      "EN18219-5.2",
      "EN18219-5.3",
      "EN18219-6.1",
    ]);
    expect(new Set(scope.map((e) => e.reason))).toEqual(new Set(["text change"]));
  });

  it("code change touches unassessed, moved-evidence and open-gap Criteria", () => {
    const scope = computeScope(
      standards,
      { kind: "code", commit: "bbbbbbb" },
      changed(["apps/main/src/a.ts"]),
    );
    expect(scope).toEqual([
      { id: "ESPR-Art12(1)", reason: "not assessed" },
      { id: "ESPR-Art9(1)", reason: "not assessed" },
      { id: "EN18219-5.1", reason: "evidence changed" },
      { id: "EN18219-5.2", reason: "open gap" },
      { id: "EN18219-5.3", reason: "not assessed" },
    ]);
  });

  it("code change prefers evidence changed over open gap and honours the sources filter", () => {
    const scope = computeScope(
      standards,
      { kind: "code", commit: "bbbbbbb", sources: ["EN18219"] },
      changed(["apps/main/src/b.ts"]),
    );
    expect(scope).toEqual([
      { id: "EN18219-5.2", reason: "evidence changed" },
      { id: "EN18219-5.3", reason: "not assessed" },
    ]);
  });

  it("check regression touches the Criteria carrying that check id", () => {
    const scope = computeScope(
      standards,
      { kind: "check", checkIds: ["gs1-resolver"] },
      nothingChanged,
    );
    expect(scope).toEqual([{ id: "EN18219-6.1", reason: "check regression" }]);
  });

  it("manual scope keeps the given order and rejects unknown ids", () => {
    expect(
      computeScope(
        standards,
        { kind: "manual", criteria: ["EN18219-5.3", "ESPR-Art9(1)"] },
        nothingChanged,
      ),
    ).toEqual([
      { id: "EN18219-5.3", reason: "manual" },
      { id: "ESPR-Art9(1)", reason: "manual" },
    ]);
    expect(() =>
      computeScope(standards, { kind: "manual", criteria: ["EN18219-9.9"] }, nothingChanged),
    ).toThrow("unknown criteria: EN18219-9.9");
  });
});

describe("the mirror rule", () => {
  const cpr = standard("CPR", [
    criterion("CPR-Art76(2)(b)", { mirrors: "ESPR-Art12(1)" }),
    criterion("CPR-Art76(2)(c)", { mirrors: "EN18219-5.2" }),
    criterion("CPR-Art76(3)"),
    criterion("CPR-Art76(4)", { mirrors: "EN18219-6.1" }),
    criterion("CPR-Art76(5)", { mirrors: "ESPR-Art9(1)", retiredIn: "e2" }),
  ]);
  const all = [espr, en, cpr];

  it("puts every active Mirror of a Criterion in scope after it, as derived", () => {
    const scope = computeScope(all, { kind: "text", sources: ["EN18219"] }, nothingChanged);
    expect(scope.slice(5)).toEqual([
      { id: "CPR-Art76(2)(b)", reason: "mirror of ESPR-Art12(1)" },
      { id: "CPR-Art76(2)(c)", reason: "mirror of EN18219-5.2" },
      { id: "CPR-Art76(4)", reason: "mirror of EN18219-6.1" },
    ]);
    expect(sourcesOf(scope)).toEqual(["ESPR", "EN18219", "CPR"]);
  });

  it("keeps a Mirror of a changed text as a text change, not twice", () => {
    const scope = computeScope(all, { kind: "text", sources: ["CPR"] }, nothingChanged);
    expect(scope).toEqual([
      { id: "CPR-Art76(2)(b)", reason: "text change" },
      { id: "CPR-Art76(2)(c)", reason: "text change" },
      { id: "CPR-Art76(3)", reason: "text change" },
      { id: "CPR-Art76(4)", reason: "text change" },
    ]);
  });

  it("never counts a Mirror as not assessed on a code change; it follows its target", () => {
    const scope = computeScope(
      all,
      { kind: "code", commit: "bbbbbbb" },
      changed(["apps/main/src/a.ts"]),
    );
    expect(scope).toEqual([
      { id: "ESPR-Art12(1)", reason: "not assessed" },
      { id: "ESPR-Art9(1)", reason: "not assessed" },
      { id: "EN18219-5.1", reason: "evidence changed" },
      { id: "EN18219-5.2", reason: "open gap" },
      { id: "EN18219-5.3", reason: "not assessed" },
      { id: "CPR-Art76(3)", reason: "not assessed" },
      { id: "CPR-Art76(2)(b)", reason: "mirror of ESPR-Art12(1)" },
      { id: "CPR-Art76(2)(c)", reason: "mirror of EN18219-5.2" },
    ]);
    expect(
      computeScope(all, { kind: "code", commit: "bbbbbbb", sources: ["CPR"] }, nothingChanged),
    ).toEqual([{ id: "CPR-Art76(3)", reason: "not assessed" }]);
  });

  it("follows a check regression and a manual pick to the target's Mirrors", () => {
    expect(
      computeScope(all, { kind: "check", checkIds: ["gs1-resolver"] }, nothingChanged),
    ).toEqual([
      { id: "EN18219-6.1", reason: "check regression" },
      { id: "CPR-Art76(4)", reason: "mirror of EN18219-6.1" },
    ]);
    // naming a Mirror by hand means re-assessing its target; the Mirror rides along as derived
    expect(
      computeScope(
        all,
        { kind: "manual", criteria: ["CPR-Art76(2)(c)", "ESPR-Art9(1)"] },
        nothingChanged,
      ),
    ).toEqual([
      { id: "EN18219-5.2", reason: "manual" },
      { id: "ESPR-Art9(1)", reason: "manual" },
      { id: "CPR-Art76(2)(c)", reason: "mirror of EN18219-5.2" },
    ]);
  });
});

describe("helpers", () => {
  it("evidencePaths keeps repo paths only and strips line suffixes", () => {
    const c = criterion("X-1", {
      assessment: {
        ...assessment("Met"),
        evidence: [
          { type: "code", ref: "apps/main/src/a.ts:12" },
          { type: "doc", ref: "docs/guide.md#L3" },
          { type: "check", ref: "gs1-resolver", result: "passed", date: "2026-09-01" },
          { type: "manual", ref: "clicked through", date: "2026-09-01" },
        ],
      },
    });
    expect(evidencePaths(c)).toEqual(["apps/main/src/a.ts", "docs/guide.md"]);
  });

  it("sourcesOf and countReasons summarise a scope, derived entries under one key", () => {
    const scope = [
      { id: "ESPR-Art9(1)", reason: "not assessed" as const },
      { id: "EN18219-5.1", reason: "open gap" as const },
      { id: "EN18219-5.2", reason: "open gap" as const },
      { id: "CPR-Art76(1)", reason: "mirror of ESPR-Art9(1)" as const },
      { id: "TOYS-Art20(1)", reason: "mirror of ESPR-Art9(1)" as const },
    ];
    expect(sourcesOf(scope)).toEqual(["ESPR", "EN18219", "CPR", "TOYS"]);
    expect(countReasons(scope)).toEqual({ "not assessed": 1, "open gap": 2, mirror: 2 });
  });
});
