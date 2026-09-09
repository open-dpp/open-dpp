import { parseDocument } from "yaml";
import { describe, expect, it } from "vitest";
import { assessedIds, newHistoryDocument, supersede, toYaml } from "./history";

const MATRIX = `# Conformance Matrix: TEST. Keep this comment.
standard: TEST
edition: e1
sections:
  - id: Art9
    title: Article 9
criteria:
  - id: TEST-Art9(1)
    section: Art9
    clause: Art. 9(1)
    paraphrase: A long paraphrase that must never be folded onto a second line by the serialiser, whatever its length happens to be.
    applicability: software
    assessment:
      date: 2026-09-01
      commit: abc1234
      validator: agent:conformance-review
      status: Gap
      gapIssue: 12
  - id: TEST-Art9(2)
    section: Art9
    clause: Art. 9(2)
    paraphrase: two
    applicability: software
  - id: TEST-Art9(3)
    section: Art9
    clause: Art. 9(3)
    paraphrase: three, restating another text
    applicability: software
    mirrors: OTHER-Art1
`;

describe("supersede", () => {
  it("moves the Assessment into history and leaves the originals untouched", () => {
    const matrix = parseDocument(MATRIX);
    const result = supersede(matrix, newHistoryDocument("TEST"), ["TEST-Art9(1)"]);

    expect(result.moved).toEqual(["TEST-Art9(1)"]);
    expect(result.history.toJS()).toEqual({
      standard: "TEST",
      entries: [
        {
          criterion: "TEST-Art9(1)",
          date: "2026-09-01",
          commit: "abc1234",
          validator: "agent:conformance-review",
          status: "Gap",
          gapIssue: 12,
        },
      ],
    });
    expect(result.matrix.getIn(["criteria", 0, "assessment"])).toBeUndefined();
    expect(matrix.getIn(["criteria", 0, "assessment"])).toBeDefined();
  });

  it("keeps comments and long lines when serialised", () => {
    const result = supersede(parseDocument(MATRIX), newHistoryDocument("TEST"), ["TEST-Art9(1)"]);
    const text = toYaml(result.matrix);
    expect(text).toContain("# Conformance Matrix: TEST. Keep this comment.");
    expect(text).toContain(
      "paraphrase: A long paraphrase that must never be folded onto a second line",
    );
    expect(text).not.toContain("assessment:");
    expect(toYaml(result.history)).toMatch(/^# Earlier Assessments of TEST/);
  });

  it("retires dropped clauses and reports Criteria without an Assessment", () => {
    const result = supersede(
      parseDocument(MATRIX),
      newHistoryDocument("TEST"),
      ["TEST-Art9(1)", "TEST-Art9(2)"],
      "e2",
    );
    expect(result.retired).toEqual(["TEST-Art9(1)", "TEST-Art9(2)"]);
    expect(result.moved).toEqual(["TEST-Art9(1)"]);
    expect(result.skipped).toEqual([]);
    expect(result.matrix.getIn(["criteria", 1, "retiredIn"])).toBe("e2");

    const plain = supersede(parseDocument(MATRIX), newHistoryDocument("TEST"), ["TEST-Art9(2)"]);
    expect(plain.skipped).toEqual(["TEST-Art9(2)"]);
  });

  it("refuses a Mirror, which carries no Assessment, unless it is being retired", () => {
    expect(() =>
      supersede(parseDocument(MATRIX), newHistoryDocument("TEST"), ["TEST-Art9(3)"]),
    ).toThrow(
      "TEST-Art9(3) is a Mirror of OTHER-Art1 and carries no Assessment; supersede OTHER-Art1 instead",
    );
    const retired = supersede(parseDocument(MATRIX), newHistoryDocument("TEST"), ["TEST-Art9(3)"], "e2");
    expect(retired.retired).toEqual(["TEST-Art9(3)"]);
    expect(retired.matrix.getIn(["criteria", 2, "retiredIn"])).toBe("e2");
  });

  it("rejects unknown ids and lists the assessed ones", () => {
    const matrix = parseDocument(MATRIX);
    expect(() => supersede(matrix, newHistoryDocument("TEST"), ["TEST-Art1"])).toThrow(
      "unknown criterion TEST-Art1",
    );
    expect(assessedIds(matrix)).toEqual(["TEST-Art9(1)"]);
  });
});
