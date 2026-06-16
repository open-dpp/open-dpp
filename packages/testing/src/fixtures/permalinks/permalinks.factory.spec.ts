import { PermalinkDtoSchema } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { gs1DataAttributesPlainFactory } from "../gs1/gs1-data-attributes.factory";
import { permalinksPlainFactory } from "./permalinks.factory";

describe("permalinksPlainFactory", () => {
  describe("default build (presentation permalink)", () => {
    it("produces an object that parses against PermalinkDtoSchema", () => {
      const result = permalinksPlainFactory.build();
      expect(() => PermalinkDtoSchema.parse(result)).not.toThrow();
    });

    it("defaults to kind='presentation'", () => {
      const result = permalinksPlainFactory.build();
      expect(result.kind).toBe("presentation");
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

    it("has gs1ResolverBase=null", () => {
      const result = permalinksPlainFactory.build();
      expect(result.gs1ResolverBase).toBeNull();
    });

    it("has primary=false", () => {
      const result = permalinksPlainFactory.build();
      expect(result.primary).toBe(false);
    });
  });

  describe("{primary:true} transient", () => {
    it("flips primary to true and still parses", () => {
      const result = permalinksPlainFactory.build(
        {},
        { transient: { primary: true } },
      );
      expect(result.primary).toBe(true);
      expect(() => PermalinkDtoSchema.parse(result)).not.toThrow();
    });
  });

  describe("gs1 transient (gs1-link kind)", () => {
    it("produces a gs1-link with uniqueProductIdentifierId set", () => {
      const result = permalinksPlainFactory.build(
        {},
        { transient: { gs1: true } },
      );
      expect(result.kind).toBe("gs1-link");
      expect(typeof result.uniqueProductIdentifierId).toBe("string");
      expect(result.uniqueProductIdentifierId).toBeTruthy();
    });

    it("has a null presentationConfigurationId by default on gs1-link", () => {
      const result = permalinksPlainFactory.build(
        {},
        { transient: { gs1: true } },
      );
      expect(result.presentationConfigurationId).toBeNull();
    });

    it("has populated gs1DataAttributes (from the gs1 data attributes factory)", () => {
      const result = permalinksPlainFactory.build(
        {},
        { transient: { gs1: true } },
      );
      expect(result.gs1DataAttributes).not.toBeNull();
      expect(typeof result.gs1DataAttributes).toBe("object");
      // Should have at least one AI entry (from default factory)
      expect(Object.keys(result.gs1DataAttributes!).length).toBeGreaterThan(0);
    });

    it("has a gs1ResolverBase set", () => {
      const result = permalinksPlainFactory.build(
        {},
        { transient: { gs1: true } },
      );
      expect(result.gs1ResolverBase).toBeTruthy();
      expect(typeof result.gs1ResolverBase).toBe("string");
    });

    it("parses against PermalinkDtoSchema", () => {
      const result = permalinksPlainFactory.build(
        {},
        { transient: { gs1: true } },
      );
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

  describe("presentationConfigurationId:null override", () => {
    it("a gs1-link with null presentationConfigurationId parses (nullability guard)", () => {
      const result = permalinksPlainFactory.build(
        { presentationConfigurationId: null },
        { transient: { gs1: true } },
      );
      expect(result.presentationConfigurationId).toBeNull();
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
