import { describe, expect, it } from "vitest";
import { CriterionSchema, MatrixFileSchema } from "./schema";
import { ScopeEntrySchema } from "./schema-runs";

const base = {
  id: "CPR-Art76(2)(b)",
  section: "Art76",
  clause: "Art. 76(2)(b)",
  paraphrase: "connected to one or more data carriers",
  applicability: "software",
};
const notApplicable = {
  date: "2026-09-01",
  commit: "abc1234",
  validator: "v",
  status: "Not applicable",
  notes: "n",
};

describe("a Mirror", () => {
  it("carries no assessment of its own", () => {
    expect(CriterionSchema.safeParse({ ...base, mirrors: "ESPR-Art10(1)(a)" }).success).toBe(true);
    const both = CriterionSchema.safeParse({
      ...base,
      mirrors: "ESPR-Art10(1)(a)",
      assessment: notApplicable,
    });
    expect(both.success).toBe(false);
    expect(JSON.stringify(both.error?.issues)).toContain("a Mirror carries no assessment");
  });

  it("points at a well-formed Criterion id of another source", () => {
    expect(CriterionSchema.safeParse({ ...base, mirrors: "nope" }).success).toBe(false);
    const file = {
      standard: "CPR",
      edition: "e",
      sections: [{ id: "Art76", title: "Article 76" }],
      criteria: [{ ...base, mirrors: "CPR-Art76(1)" }],
    };
    const parsed = MatrixFileSchema.safeParse(file);
    expect(parsed.success).toBe(false);
    expect(JSON.stringify(parsed.error?.issues)).toContain("another source");
  });
});

describe("a scope entry", () => {
  it("accepts the derived reason 'mirror of <id>' and rejects other free text", () => {
    const entry = (reason: string) => ScopeEntrySchema.safeParse({ id: base.id, reason }).success;
    expect(entry("mirror of ESPR-Art10(1)(a)")).toBe(true);
    expect(entry("text change")).toBe(true);
    expect(entry("mirror of")).toBe(false);
    expect(entry("mirror of nope")).toBe(false);
    expect(entry("copied")).toBe(false);
  });
});
