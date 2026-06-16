import { randomUUID } from "node:crypto";
import {
  UniqueProductIdentifierListItemDtoSchema,
  UniqueProductIdentifierListDtoSchema,
} from "@open-dpp/dto";
import { uniqueProductIdentifierPlainFactory } from "./unique-product-identifier.factory";

describe("uniqueProductIdentifierPlainFactory", () => {
  describe("default build (OPEN_DPP_UUID system row)", () => {
    it("produces an object with type OPEN_DPP_UUID", () => {
      const result = uniqueProductIdentifierPlainFactory.build();
      expect(result.type).toBe("OPEN_DPP_UUID");
    });

    it("has a uuid field (non-empty string)", () => {
      const result = uniqueProductIdentifierPlainFactory.build();
      expect(typeof result.uuid).toBe("string");
      expect(result.uuid.length).toBeGreaterThan(0);
    });

    it("has a referenceId that is a uuid", () => {
      const result = uniqueProductIdentifierPlainFactory.build();
      expect(typeof result.referenceId).toBe("string");
      expect(result.referenceId.length).toBeGreaterThan(0);
    });

    it("has gtin=null", () => {
      const result = uniqueProductIdentifierPlainFactory.build();
      expect(result.gtin).toBeNull();
    });

    it("parses against UniqueProductIdentifierListItemDtoSchema", () => {
      const result = uniqueProductIdentifierPlainFactory.build();
      expect(() =>
        UniqueProductIdentifierListItemDtoSchema.parse(result),
      ).not.toThrow();
    });
  });

  describe("referenceId overridable", () => {
    it("accepts a custom referenceId", () => {
      const customId = randomUUID();
      const result = uniqueProductIdentifierPlainFactory.build({
        referenceId: customId,
      });
      expect(result.referenceId).toBe(customId);
    });
  });

  describe("GS1 transient", () => {
    it("sets type to GS1", () => {
      const result = uniqueProductIdentifierPlainFactory.build(
        {},
        { transient: { gs1: true } },
      );
      expect(result.type).toBe("GS1");
    });

    it("has a valid GTIN-14", () => {
      const result = uniqueProductIdentifierPlainFactory.build(
        {},
        { transient: { gs1: true } },
      );
      expect(result.gtin).toBeTruthy();
      expect(typeof result.gtin).toBe("string");
      expect(result.gtin!.length).toBe(14);
    });

    it("parses against UniqueProductIdentifierListItemDtoSchema", () => {
      const result = uniqueProductIdentifierPlainFactory.build(
        {},
        { transient: { gs1: true } },
      );
      expect(() =>
        UniqueProductIdentifierListItemDtoSchema.parse(result),
      ).not.toThrow();
    });

    it("can include batch when requested", () => {
      const result = uniqueProductIdentifierPlainFactory.build(
        {},
        { transient: { gs1: true, batch: "LOT-42" } },
      );
      expect(result.batch).toBe("LOT-42");
    });

    it("can include serial when requested", () => {
      const result = uniqueProductIdentifierPlainFactory.build(
        {},
        { transient: { gs1: true, serial: "SN-001" } },
      );
      expect(result.serial).toBe("SN-001");
    });
  });

  describe("array of mixed rows parses against UPI list/list-item schema", () => {
    it("builds an array with mixed system and GS1 rows that parses against UniqueProductIdentifierListDtoSchema", () => {
      const systemRow = uniqueProductIdentifierPlainFactory.build();
      const gs1Row = uniqueProductIdentifierPlainFactory.build(
        {},
        { transient: { gs1: true } },
      );
      const list = [systemRow, gs1Row];
      expect(() => UniqueProductIdentifierListDtoSchema.parse(list)).not.toThrow();
    });

    it("parses an empty array against UniqueProductIdentifierListDtoSchema", () => {
      expect(() => UniqueProductIdentifierListDtoSchema.parse([])).not.toThrow();
    });
  });

  describe("immutability", () => {
    it("two consecutive builds produce distinct uuid values", () => {
      const a = uniqueProductIdentifierPlainFactory.build();
      const b = uniqueProductIdentifierPlainFactory.build();
      expect(a.uuid).not.toBe(b.uuid);
    });

    it("does not mutate the transient params object", () => {
      const transient = { gs1: true as const };
      const original = { ...transient };
      uniqueProductIdentifierPlainFactory.build({}, { transient });
      expect(transient).toEqual(original);
    });
  });
});
