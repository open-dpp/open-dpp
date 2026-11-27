import { describe, expect, it } from "vitest";
import { Gs1DataAttributesSchema } from "./gs1-data-attributes.dto";

const messagesFor = (input: unknown): string[] => {
  const result = Gs1DataAttributesSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("Gs1DataAttributesSchema", () => {
  it("accepts a valid map and the empty map", () => {
    expect(Gs1DataAttributesSchema.safeParse({ "17": "251231", "90": "ABC" }).success).toBe(true);
    expect(Gs1DataAttributesSchema.safeParse({}).success).toBe(true);
  });

  it("rejects unknown AI keys with a compact message", () => {
    const result = Gs1DataAttributesSchema.safeParse({ "9999": "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('"9999" is not a known GS1 data-attribute AI');
    }
  });

  it("rejects an AI that exists but is no data attribute with the same message", () => {
    // "01" (GTIN) is a primary identifier, not a data attribute.
    expect(messagesFor({ "01": "09506000134352" })).toEqual([
      '"01" is not a known GS1 data-attribute AI',
    ]);
  });

  it("echoes at most 50 characters of an unknown AI key", () => {
    const key = "k".repeat(80);
    expect(messagesFor({ [key]: "x" })).toEqual([
      `"${"k".repeat(50)}…" is not a known GS1 data-attribute AI`,
    ]);
  });

  it("names every unknown AI key", () => {
    expect(messagesFor({ "8888": "x", "9999": "y" })).toEqual([
      '"8888" is not a known GS1 data-attribute AI; "9999" is not a known GS1 data-attribute AI',
    ]);
  });

  it("reports no value issue while the map has an unknown AI key", () => {
    // "999999" is no valid YYMMDD date for AI 11 (see the next spec).
    expect(messagesFor({ "9999": "x", "11": "999999" })).toEqual([
      '"9999" is not a known GS1 data-attribute AI',
    ]);
  });

  it("reports only the first invalid value (bounds worst-case validation cost)", () => {
    // Each value check may cost ~100ms on adversarial input (see
    // GS1_DATA_ATTRIBUTE_MAX_LENGTH); reporting every failure would let one
    // request multiply that by the number of entries.
    const result = Gs1DataAttributesSchema.safeParse({ "11": "999999", "17": "999999" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.filter((issue) => issue.code === "custom")).toHaveLength(1);
    }
  });
});
