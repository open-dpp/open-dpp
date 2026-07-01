import { PermalinkListDtoSchema, PermalinkPublicDtoSchema } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { permalinkPublicPlainFactory } from "./permalink-public.factory";

describe("permalinkPublicPlainFactory", () => {
  describe("default build", () => {
    it("produces an object that parses against PermalinkPublicDtoSchema", () => {
      const result = permalinkPublicPlainFactory.build();
      expect(() => PermalinkPublicDtoSchema.parse(result)).not.toThrow();
    });

    it("has a valid publicUrl string", () => {
      const result = permalinkPublicPlainFactory.build();
      expect(typeof result.publicUrl).toBe("string");
      expect(() => new URL(result.publicUrl)).not.toThrow();
    });

    it("has a valid fallbackBaseUrl string", () => {
      const result = permalinkPublicPlainFactory.build();
      expect(typeof result.fallbackBaseUrl).toBe("string");
      expect(() => new URL(result.fallbackBaseUrl)).not.toThrow();
    });

    it("has fallbackBaseUrlSource in {branding, instance}", () => {
      const result = permalinkPublicPlainFactory.build();
      expect(["branding", "instance"]).toContain(result.fallbackBaseUrlSource);
    });

    it("defaults to primary=false", () => {
      const result = permalinkPublicPlainFactory.build();
      expect(result.primary).toBe(false);
    });

    it("has gs1DataAttributes=null", () => {
      const result = permalinkPublicPlainFactory.build();
      expect(result.gs1DataAttributes).toBeNull();
    });

    it("has uniqueProductIdentifierId=null", () => {
      const result = permalinkPublicPlainFactory.build();
      expect(result.uniqueProductIdentifierId).toBeNull();
    });

    it("defaults to kind='presentation'", () => {
      const result = permalinkPublicPlainFactory.build();
      expect(result.kind).toBe("presentation");
    });
  });

  describe("{primary:true} transient", () => {
    it("flips primary to true and still parses", () => {
      const result = permalinkPublicPlainFactory.build({}, { transient: { primary: true } });
      expect(result.primary).toBe(true);
      expect(() => PermalinkPublicDtoSchema.parse(result)).not.toThrow();
    });
  });

  describe("gs1 transient (gs1-link kind)", () => {
    it("produces a valid public DTO with UPI ref", () => {
      const result = permalinkPublicPlainFactory.build({}, { transient: { gs1: true } });
      expect(result.kind).toBe("gs1-link");
      expect(typeof result.uniqueProductIdentifierId).toBe("string");
      expect(result.uniqueProductIdentifierId).toBeTruthy();
    });

    it("has populated gs1DataAttributes", () => {
      const result = permalinkPublicPlainFactory.build({}, { transient: { gs1: true } });
      expect(result.gs1DataAttributes).not.toBeNull();
      expect(typeof result.gs1DataAttributes).toBe("object");
      expect(Object.keys(result.gs1DataAttributes!).length).toBeGreaterThan(0);
    });

    it("parses against PermalinkPublicDtoSchema for gs1-link", () => {
      const result = permalinkPublicPlainFactory.build({}, { transient: { gs1: true } });
      expect(() => PermalinkPublicDtoSchema.parse(result)).not.toThrow();
    });
  });

  describe("array parses against PermalinkListDtoSchema", () => {
    it("buildList(3) parses as an array of PermalinkPublicDto", () => {
      const results = permalinkPublicPlainFactory.buildList(3);
      expect(() => PermalinkListDtoSchema.parse(results)).not.toThrow();
    });

    it("mixed kinds array parses against PermalinkListDtoSchema", () => {
      const presentation = permalinkPublicPlainFactory.build();
      const gs1 = permalinkPublicPlainFactory.build({}, { transient: { gs1: true } });
      expect(() => PermalinkListDtoSchema.parse([presentation, gs1])).not.toThrow();
    });
  });

  describe("immutability", () => {
    it("does not mutate the transient params object", () => {
      const transient = { gs1: true as const };
      const original = { ...transient };
      permalinkPublicPlainFactory.build({}, { transient });
      expect(transient).toEqual(original);
    });

    it("two consecutive builds produce distinct id values", () => {
      const a = permalinkPublicPlainFactory.build();
      const b = permalinkPublicPlainFactory.build();
      expect(a.id).not.toBe(b.id);
    });
  });

  describe("param overrides", () => {
    it("accepts an overridden uniqueProductIdentifierId on gs1-link", () => {
      const customUpiId = randomUUID();
      const result = permalinkPublicPlainFactory.build(
        { uniqueProductIdentifierId: customUpiId },
        { transient: { gs1: true } },
      );
      expect(result.uniqueProductIdentifierId).toBe(customUpiId);
      expect(() => PermalinkPublicDtoSchema.parse(result)).not.toThrow();
    });
  });
});
