import { describe, expect, it } from "@jest/globals";
import {
  ExternalIdentifierType,
  ExternalIdentifierTypeSchema,
  Gs1GranularitySchema,
} from "./external-identifier-type";

describe("ExternalIdentifierType", () => {
  it("has OPEN_DPP_UUID, GS1, GTIN, and EAN keys", () => {
    expect(ExternalIdentifierType.OPEN_DPP_UUID).toBe("OPEN_DPP_UUID");
    expect(ExternalIdentifierType.GS1).toBe("GS1");
    expect(ExternalIdentifierType.GTIN).toBe("GTIN");
    expect(ExternalIdentifierType.EAN).toBe("EAN");
  });

  it("is a const-object (all four keys and no more)", () => {
    const keys = Object.keys(ExternalIdentifierType);
    expect(keys).toEqual(
      expect.arrayContaining(["OPEN_DPP_UUID", "GS1", "GTIN", "EAN"]),
    );
    expect(keys.length).toBe(4);
  });
});

describe("ExternalIdentifierTypeSchema", () => {
  it("accepts OPEN_DPP_UUID", () => {
    expect(ExternalIdentifierTypeSchema.safeParse("OPEN_DPP_UUID").success).toBe(
      true,
    );
  });

  it("accepts GS1", () => {
    expect(ExternalIdentifierTypeSchema.safeParse("GS1").success).toBe(true);
  });

  it("accepts GTIN", () => {
    expect(ExternalIdentifierTypeSchema.safeParse("GTIN").success).toBe(true);
  });

  it("accepts EAN", () => {
    expect(ExternalIdentifierTypeSchema.safeParse("EAN").success).toBe(true);
  });

  it("rejects an unknown value", () => {
    expect(ExternalIdentifierTypeSchema.safeParse("UNKNOWN").success).toBe(
      false,
    );
    expect(ExternalIdentifierTypeSchema.safeParse("").success).toBe(false);
    expect(ExternalIdentifierTypeSchema.safeParse(42).success).toBe(false);
  });
});

describe("Gs1GranularitySchema", () => {
  it("accepts 'model'", () => {
    expect(Gs1GranularitySchema.safeParse("model").success).toBe(true);
  });

  it("accepts 'batch'", () => {
    expect(Gs1GranularitySchema.safeParse("batch").success).toBe(true);
  });

  it("accepts 'item'", () => {
    expect(Gs1GranularitySchema.safeParse("item").success).toBe(true);
  });

  it("rejects an unknown value", () => {
    expect(Gs1GranularitySchema.safeParse("unknown").success).toBe(false);
    expect(Gs1GranularitySchema.safeParse("").success).toBe(false);
    expect(Gs1GranularitySchema.safeParse("BATCH").success).toBe(false);
  });

  it("infers the correct enum values", () => {
    const result = Gs1GranularitySchema.safeParse("item");
    expect(result.success).toBe(true);
    if (result.success) {
      // Type-check: result.data should be 'model' | 'batch' | 'item'
      const granularity: "model" | "batch" | "item" = result.data;
      expect(granularity).toBe("item");
    }
  });
});
