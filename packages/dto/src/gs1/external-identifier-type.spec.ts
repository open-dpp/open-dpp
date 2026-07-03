import { describe, expect, it } from "@jest/globals";
import {
  ExternalIdentifierType,
  ExternalIdentifierTypeSchema,
  Gs1GranularitySchema,
} from "./external-identifier-type";

describe("ExternalIdentifierTypeSchema", () => {
  it("pins the exact member set and wire values", () => {
    // Literal pins (not derived from the schema/object under test): these are
    // persisted wire values, so renames or additions must fail here first.
    expect(ExternalIdentifierType).toEqual({
      OPEN_DPP_UUID: "OPEN_DPP_UUID",
      GS1: "GS1",
      GTIN: "GTIN",
      EAN: "EAN",
    });
  });

  it("accepts every ExternalIdentifierType value", () => {
    for (const value of Object.values(ExternalIdentifierType)) {
      expect(ExternalIdentifierTypeSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(ExternalIdentifierTypeSchema.safeParse("UNKNOWN").success).toBe(false);
    expect(ExternalIdentifierTypeSchema.safeParse("").success).toBe(false);
    expect(ExternalIdentifierTypeSchema.safeParse(42).success).toBe(false);
  });
});

describe("Gs1GranularitySchema", () => {
  it("accepts model, batch, and item", () => {
    for (const value of ["model", "batch", "item"]) {
      expect(Gs1GranularitySchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(Gs1GranularitySchema.safeParse("unknown").success).toBe(false);
    expect(Gs1GranularitySchema.safeParse("").success).toBe(false);
    expect(Gs1GranularitySchema.safeParse("BATCH").success).toBe(false);
  });
});
