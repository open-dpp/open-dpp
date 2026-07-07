import { describe, expect, it } from "@jest/globals";
import { Gs1DataAttributesSchema } from "./gs1-data-attributes.dto";

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
