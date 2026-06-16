import { randomUUID } from "node:crypto";
import {
  CreateGs1UniqueProductIdentifierRequestSchema,
} from "@open-dpp/dto";
import { uniqueProductIdentifierCreateRequestPlainFactory } from "./unique-product-identifier-create-request.factory";

describe("uniqueProductIdentifierCreateRequestPlainFactory", () => {
  describe("default build", () => {
    it("produces an object that parses against CreateGs1UniqueProductIdentifierRequestSchema", () => {
      const result = uniqueProductIdentifierCreateRequestPlainFactory.build();
      expect(() =>
        CreateGs1UniqueProductIdentifierRequestSchema.parse(result),
      ).not.toThrow();
    });

    it("has a referenceId that is a valid UUID", () => {
      const result = uniqueProductIdentifierCreateRequestPlainFactory.build();
      expect(typeof result.referenceId).toBe("string");
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(result.referenceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("emits a raw (un-normalized) GTIN-13 that normalizes to GTIN-14 on parse", () => {
      const result = uniqueProductIdentifierCreateRequestPlainFactory.build();
      // The factory emits a raw GTIN-13 (13 digits) — i.e. un-normalized input
      expect(typeof result.gtin).toBe("string");
      expect(result.gtin.length).toBe(13);

      // Parse transforms it to GTIN-14
      const parsed = CreateGs1UniqueProductIdentifierRequestSchema.parse(result);
      expect(parsed.gtin.length).toBe(14);
    });

    it("has no batch and serial by default", () => {
      const result = uniqueProductIdentifierCreateRequestPlainFactory.build();
      // After parsing, batch/serial should be undefined (omitted or blank)
      const parsed = CreateGs1UniqueProductIdentifierRequestSchema.parse(result);
      expect(parsed.batch).toBeUndefined();
      expect(parsed.serial).toBeUndefined();
    });
  });

  describe("referenceId overridable", () => {
    it("accepts a custom referenceId", () => {
      const customId = randomUUID();
      const result = uniqueProductIdentifierCreateRequestPlainFactory.build({
        referenceId: customId,
      });
      expect(result.referenceId).toBe(customId);
    });
  });

  describe("batch transient", () => {
    it("includes batch when requested", () => {
      const result = uniqueProductIdentifierCreateRequestPlainFactory.build(
        {},
        { transient: { batch: "LOT-42" } },
      );
      expect(result.batch).toBe("LOT-42");
      // Also parses successfully
      const parsed = CreateGs1UniqueProductIdentifierRequestSchema.parse(result);
      expect(parsed.batch).toBe("LOT-42");
    });
  });

  describe("serial transient", () => {
    it("includes serial when requested", () => {
      const result = uniqueProductIdentifierCreateRequestPlainFactory.build(
        {},
        { transient: { serial: "SN-001" } },
      );
      expect(result.serial).toBe("SN-001");
      // Also parses successfully
      const parsed = CreateGs1UniqueProductIdentifierRequestSchema.parse(result);
      expect(parsed.serial).toBe("SN-001");
    });
  });

  describe("immutability", () => {
    it("two consecutive builds produce distinct referenceId values", () => {
      const a = uniqueProductIdentifierCreateRequestPlainFactory.build();
      const b = uniqueProductIdentifierCreateRequestPlainFactory.build();
      expect(a.referenceId).not.toBe(b.referenceId);
    });

    it("does not mutate the transient params object", () => {
      const transient = { batch: "LOT-1" };
      const original = { ...transient };
      uniqueProductIdentifierCreateRequestPlainFactory.build({}, { transient });
      expect(transient).toEqual(original);
    });
  });
});
