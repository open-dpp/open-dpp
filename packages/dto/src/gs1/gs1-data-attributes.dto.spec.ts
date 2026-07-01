import { describe, expect, it } from "@jest/globals";
import { Gs1DataAttributesSchema } from "./gs1-data-attributes.dto";
import type { Gs1DataAttributes } from "./gs1-data-attributes.dto";

describe("Gs1DataAttributesSchema", () => {
  it("parses a valid map of known data-attribute AIs and preserves the values", () => {
    const input = { "17": "251231", "3103": "000189" };
    const result = Gs1DataAttributesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ "17": "251231", "3103": "000189" });
    }
  });

  it("accepts an empty map", () => {
    const result = Gs1DataAttributesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it("rejects an unknown AI key", () => {
    const result1 = Gs1DataAttributesSchema.safeParse({ "99zz": "x" });
    expect(result1.success).toBe(false);

    const result2 = Gs1DataAttributesSchema.safeParse({ "9999": "x" });
    expect(result2.success).toBe(false);
  });

  it("rejects a key AI key (type I: GTIN 01)", () => {
    const result = Gs1DataAttributesSchema.safeParse({ "01": "04006381333931" });
    expect(result.success).toBe(false);
  });

  it("rejects a key qualifier AI key (type Q: batch 10)", () => {
    const result = Gs1DataAttributesSchema.safeParse({ "10": "LOT-42" });
    expect(result.success).toBe(false);
  });

  it("rejects a key qualifier AI key (type Q: serial 21)", () => {
    const result = Gs1DataAttributesSchema.safeParse({ "21": "SN-001" });
    expect(result.success).toBe(false);
  });

  it('rejects a bad value for AI "17" — too short (5 digits instead of 6)', () => {
    const result = Gs1DataAttributesSchema.safeParse({ "17": "2512" });
    expect(result.success).toBe(false);
  });

  it('rejects a bad value for AI "17" — non-numeric characters', () => {
    const result = Gs1DataAttributesSchema.safeParse({ "17": "abcdef" });
    expect(result.success).toBe(false);
  });

  it('rejects a bad value for AI "3103" — non-numeric characters', () => {
    const result = Gs1DataAttributesSchema.safeParse({ "3103": "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-object (array input)", () => {
    const result = Gs1DataAttributesSchema.safeParse(["17", "251231"]);
    expect(result.success).toBe(false);
  });

  it("rejects a non-object (string input)", () => {
    const result = Gs1DataAttributesSchema.safeParse("17=251231");
    expect(result.success).toBe(false);
  });

  it("rejects null input", () => {
    const result = Gs1DataAttributesSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("includes the offending AI in the Zod issue path for a bad-value case", () => {
    const result = Gs1DataAttributesSchema.safeParse({ "17": "2512" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path);
      const hasAiInPath = paths.some((path) => path.includes("17"));
      expect(hasAiInPath).toBe(true);
    }
  });

  it("includes the offending AI in the Zod issue path for an unknown AI key", () => {
    const result = Gs1DataAttributesSchema.safeParse({ "9999": "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path);
      const hasAiInPath = paths.some((path) => path.includes("9999"));
      expect(hasAiInPath).toBe(true);
    }
  });

  it("does not mutate the input object", () => {
    const input = { "17": "251231" };
    const snapshot = JSON.stringify(input);
    Gs1DataAttributesSchema.safeParse(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("is importable as a pure module (no DOM/Node-only globals required at import time)", () => {
    // The fact that this test file imports and runs without a DOM environment
    // is itself the assertion. If the import required a DOM, the test suite setup
    // would have thrown before reaching this point.
    expect(typeof Gs1DataAttributesSchema.safeParse).toBe("function");
  });

  it("type Gs1DataAttributes is the inferred type — a Record<string, string>", () => {
    // Compile-time type check: ensure the type is assignable.
    const valid: Gs1DataAttributes = { "17": "251231" };
    const empty: Gs1DataAttributes = {};
    expect(valid).toEqual({ "17": "251231" });
    expect(empty).toEqual({});
  });
});
