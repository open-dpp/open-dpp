import { PermalinkDtoSchema } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { gs1DataAttributesPlainFactory } from "../gs1/gs1-data-attributes.factory";
import { permalinksPlainFactory } from "./permalinks.factory";

describe("permalinksPlainFactory", () => {
  describe("default build (open-dpp permalink)", () => {
    it("produces an object that parses against PermalinkDtoSchema", () => {
      const result = permalinksPlainFactory.build();
      expect(() => PermalinkDtoSchema.parse(result)).not.toThrow();
    });

    it("defaults to kind='open-dpp'", () => {
      const result = permalinksPlainFactory.build();
      expect(result.kind).toBe("open-dpp");
    });

    it("has a passportId that is a UUID", () => {
      const result = permalinksPlainFactory.build();
      expect(result.passportId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("has a non-null presentationConfigurationId", () => {
      const result = permalinksPlainFactory.build();
      expect(result.presentationConfigurationId).toBeTruthy();
      expect(typeof result.presentationConfigurationId).toBe("string");
    });

    it("has uniqueProductIdentifierId=null", () => {
      const result = permalinksPlainFactory.build();
      expect(result.uniqueProductIdentifierId).toBeNull();
    });

    it("has gs1DataAttributes=null", () => {
      const result = permalinksPlainFactory.build();
      expect(result.gs1DataAttributes).toBeNull();
    });

    it("does not include the removed 'primary' field", () => {
      const result = permalinksPlainFactory.build();
      expect("primary" in result).toBe(false);
    });
  });

  describe("bare open-dpp permalink (both refs null)", () => {
    it("parses when presentationConfigurationId is overridden to null", () => {
      const result = permalinksPlainFactory.build({ presentationConfigurationId: null });
      expect(result.presentationConfigurationId).toBeNull();
      expect(result.uniqueProductIdentifierId).toBeNull();
      expect(() => PermalinkDtoSchema.parse(result)).not.toThrow();
    });
  });

  describe("open-dpp permalink bound to a UPI", () => {
    it("parses with an overridden uniqueProductIdentifierId", () => {
      const upiId = randomUUID();
      const result = permalinksPlainFactory.build({ uniqueProductIdentifierId: upiId });
      expect(result.kind).toBe("open-dpp");
      expect(result.uniqueProductIdentifierId).toBe(upiId);
      expect(() => PermalinkDtoSchema.parse(result)).not.toThrow();
    });
  });

  describe("gs1 transient (gs1-link kind)", () => {
    it("produces a gs1-link with uniqueProductIdentifierId set", () => {
      const result = permalinksPlainFactory.build({}, { transient: { gs1: true } });
      expect(result.kind).toBe("gs1-link");
      expect(typeof result.uniqueProductIdentifierId).toBe("string");
      expect(result.uniqueProductIdentifierId).toBeTruthy();
    });

    it("has a passportId on gs1-link", () => {
      const result = permalinksPlainFactory.build({}, { transient: { gs1: true } });
      expect(result.passportId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("has a null presentationConfigurationId by default on gs1-link", () => {
      const result = permalinksPlainFactory.build({}, { transient: { gs1: true } });
      expect(result.presentationConfigurationId).toBeNull();
    });

    it("has populated gs1DataAttributes (from the gs1 data attributes factory)", () => {
      const result = permalinksPlainFactory.build({}, { transient: { gs1: true } });
      expect(result.gs1DataAttributes).not.toBeNull();
      expect(typeof result.gs1DataAttributes).toBe("object");
      expect(Object.keys(result.gs1DataAttributes!).length).toBeGreaterThan(0);
    });

    it("parses against PermalinkDtoSchema", () => {
      const result = permalinksPlainFactory.build({}, { transient: { gs1: true } });
      expect(() => PermalinkDtoSchema.parse(result)).not.toThrow();
    });
  });

  describe("gs1-link that ALSO sets a presentationConfigurationId", () => {
    it("parses when a config is provided on a gs1-link", () => {
      const configId = randomUUID();
      const result = permalinksPlainFactory.build(
        { presentationConfigurationId: configId },
        { transient: { gs1: true } },
      );
      expect(result.kind).toBe("gs1-link");
      expect(result.presentationConfigurationId).toBe(configId);
      expect(() => PermalinkDtoSchema.parse(result)).not.toThrow();
    });
  });

  describe("gs1DataAttributes transient override", () => {
    it("accepts a custom gs1DataAttributes map from the factory", () => {
      const attrs = gs1DataAttributesPlainFactory.build(
        {},
        { transient: { entries: { "3103": "000189" } } },
      );
      const result = permalinksPlainFactory.build(
        { gs1DataAttributes: attrs },
        { transient: { gs1: true } },
      );
      expect(result.gs1DataAttributes).toEqual({ "3103": "000189" });
      expect(() => PermalinkDtoSchema.parse(result)).not.toThrow();
    });
  });

  describe("immutability", () => {
    it("does not mutate the transient params object", () => {
      const transient = { gs1: true as const };
      const original = { ...transient };
      permalinksPlainFactory.build({}, { transient });
      expect(transient).toEqual(original);
    });

    it("two consecutive builds produce distinct id values", () => {
      const a = permalinksPlainFactory.build();
      const b = permalinksPlainFactory.build();
      expect(a.id).not.toBe(b.id);
    });
  });
});
