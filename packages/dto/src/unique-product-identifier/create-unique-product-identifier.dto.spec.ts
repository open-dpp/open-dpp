import { CreateGs1UniqueProductIdentifierRequestSchema } from "./create-unique-product-identifier.dto";

/**
 * Slice 10: CreateGs1UniqueProductIdentifierRequestSchema (create DTO).
 *
 * GS1-only by construction (no `type` field, no data attributes).
 * Transforms gtin to GTIN-14, coerces blank batch/serial to undefined, trims.
 */
describe("CreateGs1UniqueProductIdentifierRequestSchema", () => {
  const VALID_GTIN13 = "4006381333931"; // 13-digit, valid check digit → normalizes to 14
  const VALID_GTIN14 = "04006381333931"; // already GTIN-14
  const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

  describe("acceptance — valid inputs", () => {
    it("accepts a minimal request with referenceId and gtin only, normalises gtin to GTIN-14", () => {
      const result = CreateGs1UniqueProductIdentifierRequestSchema.parse({
        referenceId: VALID_UUID,
        gtin: VALID_GTIN13,
      });
      expect(result.referenceId).toBe(VALID_UUID);
      expect(result.gtin).toBe(VALID_GTIN14);
      expect(result.batch).toBeUndefined();
      expect(result.serial).toBeUndefined();
    });

    it("accepts a request with gtin already in GTIN-14 form", () => {
      const result = CreateGs1UniqueProductIdentifierRequestSchema.parse({
        referenceId: VALID_UUID,
        gtin: VALID_GTIN14,
      });
      expect(result.gtin).toBe(VALID_GTIN14);
    });

    it("accepts optional batch and serial", () => {
      const result = CreateGs1UniqueProductIdentifierRequestSchema.parse({
        referenceId: VALID_UUID,
        gtin: VALID_GTIN13,
        batch: "LOT-42",
        serial: "SN-001",
      });
      expect(result.batch).toBe("LOT-42");
      expect(result.serial).toBe("SN-001");
    });

    it("trims surrounding whitespace from gtin", () => {
      const result = CreateGs1UniqueProductIdentifierRequestSchema.parse({
        referenceId: VALID_UUID,
        gtin: `  ${VALID_GTIN13}  `,
      });
      expect(result.gtin).toBe(VALID_GTIN14);
    });

    it("coerces blank batch to undefined (clear semantics)", () => {
      const result = CreateGs1UniqueProductIdentifierRequestSchema.parse({
        referenceId: VALID_UUID,
        gtin: VALID_GTIN13,
        batch: "  ",
      });
      expect(result.batch).toBeUndefined();
    });

    it("coerces blank serial to undefined (clear semantics)", () => {
      const result = CreateGs1UniqueProductIdentifierRequestSchema.parse({
        referenceId: VALID_UUID,
        gtin: VALID_GTIN13,
        serial: "   ",
      });
      expect(result.serial).toBeUndefined();
    });

    it("trims batch and serial values", () => {
      const result = CreateGs1UniqueProductIdentifierRequestSchema.parse({
        referenceId: VALID_UUID,
        gtin: VALID_GTIN13,
        batch: "  LOT-1  ",
        serial: "  SN-1  ",
      });
      expect(result.batch).toBe("LOT-1");
      expect(result.serial).toBe("SN-1");
    });
  });

  describe("rejections", () => {
    it("rejects a missing referenceId", () => {
      expect(() =>
        CreateGs1UniqueProductIdentifierRequestSchema.parse({
          gtin: VALID_GTIN13,
        }),
      ).toThrow();
    });

    it("rejects a non-UUID referenceId", () => {
      expect(() =>
        CreateGs1UniqueProductIdentifierRequestSchema.parse({
          referenceId: "not-a-uuid",
          gtin: VALID_GTIN13,
        }),
      ).toThrow();
    });

    it("rejects an invalid GTIN check digit", () => {
      expect(() =>
        CreateGs1UniqueProductIdentifierRequestSchema.parse({
          referenceId: VALID_UUID,
          gtin: "4006381333939", // altered last digit — invalid check
        }),
      ).toThrow();
    });

    it("rejects a batch with CSET-82 violations (e.g. emoji)", () => {
      expect(() =>
        CreateGs1UniqueProductIdentifierRequestSchema.parse({
          referenceId: VALID_UUID,
          gtin: VALID_GTIN13,
          batch: "LOT🚀",
        }),
      ).toThrow();
    });

    it("rejects an over-length serial (> 20 chars)", () => {
      expect(() =>
        CreateGs1UniqueProductIdentifierRequestSchema.parse({
          referenceId: VALID_UUID,
          gtin: VALID_GTIN13,
          serial: "SN-12345678901234567890", // 23 chars
        }),
      ).toThrow();
    });

    it("rejects a missing gtin", () => {
      expect(() =>
        CreateGs1UniqueProductIdentifierRequestSchema.parse({
          referenceId: VALID_UUID,
        }),
      ).toThrow();
    });
  });

  describe("no type field, no data attributes", () => {
    it("strips a type field if passed (no type accepted by schema)", () => {
      // The schema is GS1-only — there is no `type` field.
      // Parsing with an extra `type` must not include it in the output.
      const result = CreateGs1UniqueProductIdentifierRequestSchema.parse({
        referenceId: VALID_UUID,
        gtin: VALID_GTIN13,
        type: "GS1", // unexpected extra field — must be stripped
      });
      expect((result as Record<string, unknown>).type).toBeUndefined();
    });

    it("strips a gs1DataAttributes field if passed", () => {
      const result = CreateGs1UniqueProductIdentifierRequestSchema.parse({
        referenceId: VALID_UUID,
        gtin: VALID_GTIN13,
        gs1DataAttributes: { "17": "251231" }, // not part of create DTO
      });
      expect((result as Record<string, unknown>).gs1DataAttributes).toBeUndefined();
    });
  });
});
