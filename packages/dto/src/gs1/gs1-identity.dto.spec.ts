import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import {
  Gs1IdentityDtoSchema,
  Gs1IdentityRequestSchema,
  Gs1IdentityResponseSchema,
} from "./gs1-identity.dto";

const VALID_GTIN13 = "4006381333931";
const VALID_GTIN13_AS_14 = "04006381333931";

describe("Gs1IdentityRequestSchema", () => {
  it("accepts a bare GTIN (no batch / serial)", () => {
    const result = Gs1IdentityRequestSchema.safeParse({ gtin: VALID_GTIN13 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gtin).toBe(VALID_GTIN13_AS_14);
      expect(result.data.batch).toBeUndefined();
      expect(result.data.serial).toBeUndefined();
    }
  });

  it("accepts a GTIN with a valid batch and serial", () => {
    const result = Gs1IdentityRequestSchema.safeParse({
      gtin: VALID_GTIN13,
      batch: "LOT-42",
      serial: "SN-001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.batch).toBe("LOT-42");
      expect(result.data.serial).toBe("SN-001");
    }
  });

  it("coerces an empty-string batch / serial to undefined (clear semantics)", () => {
    const result = Gs1IdentityRequestSchema.safeParse({
      gtin: VALID_GTIN13,
      batch: "",
      serial: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.batch).toBeUndefined();
      expect(result.data.serial).toBeUndefined();
    }
  });

  it("trims surrounding whitespace on batch / serial", () => {
    const result = Gs1IdentityRequestSchema.safeParse({
      gtin: VALID_GTIN13,
      batch: "  LOT-42  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.batch).toBe("LOT-42");
    }
  });

  it("rejects an over-length serial", () => {
    const result = Gs1IdentityRequestSchema.safeParse({
      gtin: VALID_GTIN13,
      serial: "x".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a batch with a character outside CSET-82", () => {
    const result = Gs1IdentityRequestSchema.safeParse({
      gtin: VALID_GTIN13,
      batch: "bad value",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid GTIN", () => {
    const result = Gs1IdentityRequestSchema.safeParse({ gtin: "4006381333930" });
    expect(result.success).toBe(false);
  });
});

describe("Gs1IdentityDtoSchema", () => {
  it("accepts a normalized identity with optional batch and serial", () => {
    const result = Gs1IdentityDtoSchema.safeParse({
      gtin: VALID_GTIN13_AS_14,
      batch: "LOT-42",
      serial: "SN-001",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a bare normalized GTIN", () => {
    expect(Gs1IdentityDtoSchema.safeParse({ gtin: VALID_GTIN13_AS_14 }).success).toBe(true);
  });

  it("rejects a non-normalized GTIN", () => {
    expect(Gs1IdentityDtoSchema.safeParse({ gtin: VALID_GTIN13 }).success).toBe(false);
  });
});

describe("Gs1IdentityResponseSchema", () => {
  it("accepts a full response with batch, serial and Digital Link", () => {
    const result = Gs1IdentityResponseSchema.safeParse({
      uuid: randomUUID(),
      referenceId: randomUUID(),
      gtin: VALID_GTIN13_AS_14,
      batch: "LOT-42",
      serial: "SN-001",
      digitalLink: `https://id.example.com/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001`,
    });
    expect(result.success).toBe(true);
  });
});
