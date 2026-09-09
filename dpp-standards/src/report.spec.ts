import { parseDocument } from "yaml";
import { describe, expect, it } from "vitest";
import { toYaml } from "./history";
import { CheckReportSchema, foldReport } from "./report";
import { AssessmentSchema } from "./schema";

const MATRIX = `# keep
standard: ESPR
edition: e1
sections:
  - id: Art10
    title: Article 10
criteria:
  - id: ESPR-Art10(1)(a)
    section: Art10
    clause: Art. 10(1)(a)
    paraphrase: connected through a data carrier
    applicability: software
    assessment:
      date: 2026-09-01
      commit: abc1234
      validator: v
      status: Met
      evidence:
        - type: code
          ref: apps/main/src/x.ts
        - type: check
          ref: resolver.redirect-published
          result: passed
          date: 2026-09-01
  - id: ESPR-Art10(1)(b)
    section: Art10
    clause: Art. 10(1)(b)
    paraphrase: physically present
    applicability: software
  - id: ESPR-Art10(1)(c)
    section: Art10
    clause: Art. 10(1)(c)
    paraphrase: restates a battery rule
    applicability: software
    mirrors: BATT-Art77(1)
`;

const report = {
  commit: "def5678",
  date: "2026-09-10",
  baseUrl: "http://localhost:3000",
  checks: [
    {
      id: "resolver.redirect-published",
      title: "published key redirects",
      criteria: ["ESPR-Art10(1)(a)"],
      status: "failed",
      error: "expected 302, got 500",
    },
    {
      id: "resolver.head-like-get",
      title: "HEAD answers like GET",
      criteria: ["ESPR-Art10(1)(a)", "ESPR-Art10(1)(b)"],
      status: "passed",
    },
    {
      id: "a11y.public-view",
      title: "no serious axe violations",
      criteria: ["ESPR-Art10(1)(b)"],
      status: "skipped",
    },
  ],
} as const;

describe("CheckReportSchema", () => {
  it("accepts a report and rejects malformed check ids and criterion ids", () => {
    expect(CheckReportSchema.parse(report).checks).toHaveLength(3);
    expect(
      CheckReportSchema.safeParse({ ...report, checks: [{ ...report.checks[1], id: "HEAD" }] })
        .success,
    ).toBe(false);
    expect(
      CheckReportSchema.safeParse({
        ...report,
        checks: [{ ...report.checks[1], criteria: ["nope"] }],
      }).success,
    ).toBe(false);
  });
});

describe("foldReport", () => {
  it("updates existing check evidence, adds passing checks to assessed Criteria, leaves the rest alone", () => {
    const result = foldReport(parseDocument(MATRIX), CheckReportSchema.parse(report));
    const evidence = result.matrix.getIn(["criteria", 0, "assessment", "evidence"]);
    expect(JSON.parse(JSON.stringify(evidence))).toEqual([
      { type: "code", ref: "apps/main/src/x.ts" },
      { type: "check", ref: "resolver.redirect-published", result: "failed", date: "2026-09-10" },
      { type: "check", ref: "resolver.head-like-get", result: "passed", date: "2026-09-10" },
    ]);
    expect(result.matrix.getIn(["criteria", 0, "assessment", "status"])).toBe("Met");
    expect(result.matrix.getIn(["criteria", 1, "assessment"])).toBeUndefined();
    expect(result.updated).toEqual([
      { criterion: "ESPR-Art10(1)(a)", check: "resolver.redirect-published" },
    ]);
    expect(result.added).toEqual([
      { criterion: "ESPR-Art10(1)(a)", check: "resolver.head-like-get" },
    ]);
    expect(result.failing).toEqual([
      { criterion: "ESPR-Art10(1)(a)", check: "resolver.redirect-published" },
    ]);
    expect(result.unassessed).toEqual([
      { criterion: "ESPR-Art10(1)(b)", check: "resolver.head-like-get" },
    ]);
    expect(toYaml(result.matrix)).toContain("# keep");
  });

  it("rejects a tag that names a Mirror: a Check evidences the target", () => {
    const onMirror = { ...report, checks: [{ ...report.checks[1], criteria: ["ESPR-Art10(1)(c)"] }] };
    expect(() => foldReport(parseDocument(MATRIX), CheckReportSchema.parse(onMirror))).toThrow(
      "check resolver.head-like-get tags ESPR-Art10(1)(c), a Mirror of BATT-Art77(1); tag the target instead",
    );
  });

  it("ignores checks of other standards and rejects unknown Criteria of this standard", () => {
    const foreign = { ...report, checks: [{ ...report.checks[1], criteria: ["BATT-Art77(1)"] }] };
    expect(foldReport(parseDocument(MATRIX), CheckReportSchema.parse(foreign)).added).toEqual([]);
    const unknown = { ...report, checks: [{ ...report.checks[1], criteria: ["ESPR-Art99"] }] };
    expect(() => foldReport(parseDocument(MATRIX), CheckReportSchema.parse(unknown))).toThrow(
      "unknown criterion ESPR-Art99",
    );
  });
});

describe("Met with check evidence", () => {
  const met = {
    date: "2026-09-01",
    commit: "abc1234",
    validator: "v",
    status: "Met",
    evidence: [{ type: "code", ref: "apps/main/src/x.ts" }],
  };
  it("requires every check to have passed", () => {
    const passed = {
      type: "check",
      ref: "resolver.redirect-published",
      result: "passed",
      date: "2026-09-01",
    };
    expect(
      AssessmentSchema.safeParse({ ...met, evidence: [...met.evidence, passed] }).success,
    ).toBe(true);
    const failed = { ...passed, result: "failed" };
    const parsed = AssessmentSchema.safeParse({ ...met, evidence: [...met.evidence, failed] });
    expect(parsed.success).toBe(false);
    expect(JSON.stringify(parsed.error?.issues)).toContain("failed check");
    expect(
      AssessmentSchema.safeParse({
        ...met,
        evidence: [...met.evidence, { type: "check", ref: "x" }],
      }).success,
    ).toBe(false);
  });
});
