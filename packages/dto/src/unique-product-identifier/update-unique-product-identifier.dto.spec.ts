import { UpdateGs1UniqueProductIdentifierRequestSchema } from "./update-unique-product-identifier.dto";

/**
 * Slice 11: UpdateGs1UniqueProductIdentifierRequestSchema (update DTO).
 *
 * Like the create DTO but without `referenceId` (reference is immutable).
 * GS1-only by construction (no `type` field, no data attributes).
 * Transforms gtin to GTIN-14, coerces blank batch/serial to undefined, trims.
 *
 * "Omitting batch/serial means clear that qualifier" — replace-not-merge
 * semantics matching domain `withGs1`.
 */
describe("UpdateGs1UniqueProductIdentifierRequestSchema", () => {
  const VALID_GTIN13 = "4006381333931"; // 13-digit, valid check digit → normalizes to 14
  const VALID_GTIN14 = "04006381333931"; // already GTIN-14

  describe("acceptance — valid inputs", () => {
    it("accepts a minimal request with gtin only, normalises gtin to GTIN-14", () => {
      const result = UpdateGs1UniqueProductIdentifierRequestSchema.parse({
        gtin: VALID_GTIN13,
      });
      expect(result.gtin).toBe(VALID_GTIN14);
      expect(result.batch).toBeUndefined();
      expect(result.serial).toBeUndefined();
    });

    it("accepts a gtin already in GTIN-14 form", () => {
      const result = UpdateGs1UniqueProductIdentifierRequestSchema.parse({
        gtin: VALID_GTIN14,
      });
      expect(result.gtin).toBe(VALID_GTIN14);
    });

    it("accepts optional batch and serial", () => {
      const result = UpdateGs1UniqueProductIdentifierRequestSchema.parse({
        gtin: VALID_GTIN13,
        batch: "LOT-42",
        serial: "SN-001",
      });
      expect(result.batch).toBe("LOT-42");
      expect(result.serial).toBe("SN-001");
    });

    it("trims surrounding whitespace from gtin", () => {
      const result = UpdateGs1UniqueProductIdentifierRequestSchema.parse({
        gtin: `  ${VALID_GTIN13}  `,
      });
      expect(result.gtin).toBe(VALID_GTIN14);
    });

    it("coerces blank batch to undefined (clear semantics)", () => {
      const result = UpdateGs1UniqueProductIdentifierRequestSchema.parse({
        gtin: VALID_GTIN13,
        batch: "  ",
      });
      expect(result.batch).toBeUndefined();
    });

    it("coerces blank serial to undefined (clear semantics)", () => {
      const result = UpdateGs1UniqueProductIdentifierRequestSchema.parse({
        gtin: VALID_GTIN13,
        serial: "   ",
      });
      expect(result.serial).toBeUndefined();
    });

    it("trims batch and serial values", () => {
      const result = UpdateGs1UniqueProductIdentifierRequestSchema.parse({
        gtin: VALID_GTIN13,
        batch: "  LOT-1  ",
        serial: "  SN-1  ",
      });
      expect(result.batch).toBe("LOT-1");
      expect(result.serial).toBe("SN-1");
    });

    it("omitting batch/serial means clear those qualifiers (replace-not-merge)", () => {
      // Omitting is valid — the result has no batch/serial (clear semantics)
      const result = UpdateGs1UniqueProductIdentifierRequestSchema.parse({
        gtin: VALID_GTIN13,
      });
      expect(result.batch).toBeUndefined();
      expect(result.serial).toBeUndefined();
    });
  });

  describe("rejections", () => {
    it("rejects a missing gtin", () => {
      expect(() =>
        UpdateGs1UniqueProductIdentifierRequestSchema.parse({}),
      ).toThrow();
    });

    it("rejects an invalid GTIN check digit", () => {
      expect(() =>
        UpdateGs1UniqueProductIdentifierRequestSchema.parse({
          gtin: "4006381333939", // altered last digit — invalid check
        }),
      ).toThrow();
    });

    it("rejects a batch with CSET-82 violations (e.g. emoji)", () => {
      expect(() =>
        UpdateGs1UniqueProductIdentifierRequestSchema.parse({
          gtin: VALID_GTIN13,
          batch: "LOT🚀",
        }),
      ).toThrow();
    });

    it("rejects an over-length serial (> 20 chars)", () => {
      expect(() =>
        UpdateGs1UniqueProductIdentifierRequestSchema.parse({
          gtin: VALID_GTIN13,
          serial: "SN-12345678901234567890", // 23 chars
        }),
      ).toThrow();
    });
  });

  describe("no referenceId, no type field, no data attributes", () => {
    it("does not accept a referenceId field (reference is immutable)", () => {
      // The update schema has no referenceId — it must be stripped from output
      const result = UpdateGs1UniqueProductIdentifierRequestSchema.parse({
        gtin: VALID_GTIN13,
        referenceId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect((result as Record<string, unknown>).referenceId).toBeUndefined();
    });

    it("strips a type field if passed (no type accepted by schema)", () => {
      const result = UpdateGs1UniqueProductIdentifierRequestSchema.parse({
        gtin: VALID_GTIN13,
        type: "GS1",
      });
      expect((result as Record<string, unknown>).type).toBeUndefined();
    });

    it("strips a gs1DataAttributes field if passed", () => {
      const result = UpdateGs1UniqueProductIdentifierRequestSchema.parse({
        gtin: VALID_GTIN13,
        gs1DataAttributes: { "17": "251231" },
      });
      expect(
        (result as Record<string, unknown>).gs1DataAttributes,
      ).toBeUndefined();
    });
  });
});
