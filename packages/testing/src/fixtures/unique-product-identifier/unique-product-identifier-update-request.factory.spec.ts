import {
  UpdateGs1UniqueProductIdentifierRequestSchema,
} from "@open-dpp/dto";
import { uniqueProductIdentifierUpdateRequestPlainFactory } from "./unique-product-identifier-update-request.factory";

describe("uniqueProductIdentifierUpdateRequestPlainFactory", () => {
  describe("default build", () => {
    it("produces an object that parses against UpdateGs1UniqueProductIdentifierRequestSchema", () => {
      const result = uniqueProductIdentifierUpdateRequestPlainFactory.build();
      expect(() =>
        UpdateGs1UniqueProductIdentifierRequestSchema.parse(result),
      ).not.toThrow();
    });

    it("does NOT have a referenceId field (reference is immutable on update)", () => {
      const result = uniqueProductIdentifierUpdateRequestPlainFactory.build();
      expect((result as unknown as Record<string, unknown>).referenceId).toBeUndefined();
    });

    it("emits a raw (un-normalized) GTIN-13 that normalizes to GTIN-14 on parse", () => {
      const result = uniqueProductIdentifierUpdateRequestPlainFactory.build();
      // The factory emits a raw GTIN-13 (13 digits) — i.e. un-normalized input
      expect(typeof result.gtin).toBe("string");
      expect(result.gtin.length).toBe(13);

      // Parse transforms it to GTIN-14
      const parsed = UpdateGs1UniqueProductIdentifierRequestSchema.parse(result);
      expect(parsed.gtin.length).toBe(14);
    });

    it("has no batch and serial by default", () => {
      const result = uniqueProductIdentifierUpdateRequestPlainFactory.build();
      const parsed = UpdateGs1UniqueProductIdentifierRequestSchema.parse(result);
      expect(parsed.batch).toBeUndefined();
      expect(parsed.serial).toBeUndefined();
    });
  });

  describe("batch transient", () => {
    it("includes batch when requested", () => {
      const result = uniqueProductIdentifierUpdateRequestPlainFactory.build(
        {},
        { transient: { batch: "LOT-42" } },
      );
      expect(result.batch).toBe("LOT-42");
      const parsed = UpdateGs1UniqueProductIdentifierRequestSchema.parse(result);
      expect(parsed.batch).toBe("LOT-42");
    });
  });

  describe("serial transient", () => {
    it("includes serial when requested", () => {
      const result = uniqueProductIdentifierUpdateRequestPlainFactory.build(
        {},
        { transient: { serial: "SN-001" } },
      );
      expect(result.serial).toBe("SN-001");
      const parsed = UpdateGs1UniqueProductIdentifierRequestSchema.parse(result);
      expect(parsed.serial).toBe("SN-001");
    });
  });

  describe("immutability", () => {
    it("does not mutate the transient params object", () => {
      const transient = { batch: "LOT-1" };
      const original = { ...transient };
      uniqueProductIdentifierUpdateRequestPlainFactory.build({}, { transient });
      expect(transient).toEqual(original);
    });
  });
});
