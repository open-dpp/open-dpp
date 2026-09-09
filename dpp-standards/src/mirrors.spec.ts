import { describe, expect, it } from "vitest";
import { emptyCounts } from "./load";
import { blockingMirrors, resolveMirrors } from "./mirrors";
import { assessment, criterion, standard } from "./spec-fixtures";

const espr = standard("ESPR", [
  criterion("ESPR-Art10(1)(a)", { assessment: { ...assessment("Partial"), gapIssue: 12 } }),
  criterion("ESPR-Art10(1)(b)"),
  criterion("ESPR-Art10(1)(c)", { retiredIn: "e2" }),
  criterion("ESPR-Art9(2)(a)", { applicability: "commission" }),
]);
const cpr = standard("CPR", [
  criterion("CPR-Art76(2)(b)", { mirrors: "ESPR-Art10(1)(a)" }),
  criterion("CPR-Art76(2)(c)", { mirrors: "ESPR-Art10(1)(b)" }),
  criterion("CPR-Art76(3)", { assessment: assessment("Met") }),
]);
const toys = standard("TOYS", [
  criterion("TOYS-Art20(1)", { mirrors: "CPR-Art76(2)(b)" }),
  criterion("TOYS-Art20(2)", { mirrors: "ESPR-Art99" }),
  criterion("TOYS-Art20(3)", { mirrors: "ESPR-Art10(1)(c)" }),
  criterion("TOYS-Art20(4)", { mirrors: "ESPR-Art9(2)(a)" }),
  criterion("TOYS-Art20(5)", { mirrors: "ESPR-Art10(1)(a)", retiredIn: "e2" }),
]);

describe("resolveMirrors", () => {
  it("derives status and assessment from the target and counts inherited statuses apart", () => {
    const { standards, problems } = resolveMirrors([espr, cpr]);
    expect(problems).toEqual([]);
    const [resolvedEspr, resolvedCpr] = standards;
    expect(resolvedEspr).toEqual(espr);
    expect(resolvedCpr.inherited).toEqual({
      "CPR-Art76(2)(b)": {
        from: "ESPR-Art10(1)(a)",
        standard: "ESPR",
        slug: "espr",
        status: "Partial",
        assessment: espr.criteria[0].assessment,
      },
      "CPR-Art76(2)(c)": {
        from: "ESPR-Art10(1)(b)",
        standard: "ESPR",
        slug: "espr",
        status: "Not assessed",
      },
    });
    expect(resolvedCpr.counts).toEqual({ ...emptyCounts(), Met: 1 });
    expect(resolvedCpr.inheritedCounts).toEqual({
      ...emptyCounts(),
      Partial: 1,
      "Not assessed": 1,
    });
    // the inputs are left untouched
    expect(cpr.inherited).toEqual({});
    expect(cpr.inheritedCounts).toEqual(emptyCounts());
  });

  it("reports dangling, chained, retired and actor-changing targets and skips retired Mirrors", () => {
    const { standards, problems } = resolveMirrors([espr, cpr, toys]);
    expect(problems.map((p) => [p.path, p.message])).toEqual([
      [
        "criteria.0.mirrors",
        "TOYS-Art20(1) mirrors CPR-Art76(2)(b), which is itself a Mirror of ESPR-Art10(1)(a); point at ESPR-Art10(1)(a)",
      ],
      ["criteria.1.mirrors", "TOYS-Art20(2) mirrors unknown criterion ESPR-Art99"],
      [
        "criteria.2.mirrors",
        "TOYS-Art20(3) mirrors ESPR-Art10(1)(c), retired in e2; re-point or retire the Mirror",
      ],
      [
        "criteria.3.mirrors",
        "TOYS-Art20(4) (software) mirrors ESPR-Art9(2)(a) (commission); a Mirror binds the same actor, any delta makes it an own Criterion",
      ],
    ]);
    expect(problems.every((p) => p.file === "matrix/TOYS.yaml")).toBe(true);
    expect(standards[2].inherited).toEqual({});
    expect(standards[2].inheritedCounts).toEqual(emptyCounts());
  });
});

describe("blockingMirrors", () => {
  it("names the active Mirrors of every Criterion about to be retired", () => {
    expect(
      blockingMirrors(["ESPR-Art10(1)(a)", "ESPR-Art10(1)(b)", "CPR-Art76(3)"], [espr, cpr, toys]),
    ).toEqual([
      { id: "ESPR-Art10(1)(a)", mirrors: ["CPR-Art76(2)(b)"] },
      { id: "ESPR-Art10(1)(b)", mirrors: ["CPR-Art76(2)(c)"] },
    ]);
  });
});
