import { describe, expect, it } from "@jest/globals";
import { BrandingDtoSchema } from "../branding/branding.dto";
import {
  InstanceSettingsDtoSchema,
  InstanceSettingsUpdateDtoSchema,
} from "../instance-settings/instance-settings.dto";

/**
 * The configurable GS1 resolver base URL surfaces on two DTOs: the instance
 * settings (default for all organizations) and an organization's branding
 * (per-org override). Both validate the value as an http(s) URL and canonicalise
 * it, mirroring the permalink base URL.
 */
describe("gs1ResolverBaseUrl DTO validation", () => {
  describe("InstanceSettingsUpdateDtoSchema", () => {
    it("accepts a valid http(s) URL and canonicalises it", () => {
      const parsed = InstanceSettingsUpdateDtoSchema.parse({
        gs1ResolverBaseUrl: "https://ID.Acme.com/",
      });
      expect(parsed.gs1ResolverBaseUrl).toBe("https://id.acme.com");
    });

    it("accepts null to clear the setting", () => {
      const parsed = InstanceSettingsUpdateDtoSchema.parse({ gs1ResolverBaseUrl: null });
      expect(parsed.gs1ResolverBaseUrl).toBeNull();
    });

    it("rejects a non-URL value", () => {
      expect(() =>
        InstanceSettingsUpdateDtoSchema.parse({ gs1ResolverBaseUrl: "not-a-url" }),
      ).toThrow();
    });

    it("rejects a URL carrying a query or fragment", () => {
      expect(() =>
        InstanceSettingsUpdateDtoSchema.parse({ gs1ResolverBaseUrl: "https://id.acme.com?x=1" }),
      ).toThrow();
    });
  });

  describe("InstanceSettingsDtoSchema", () => {
    it("requires the gs1ResolverBaseUrl setting and its effective fallback in the response", () => {
      const parsed = InstanceSettingsDtoSchema.parse({
        id: "x",
        signupEnabled: { value: true },
        organizationCreationEnabled: { value: true },
        permalinkBaseUrl: { value: null },
        gs1ResolverBaseUrl: { value: null },
        effectiveFallback: "https://example.com/p",
        gs1EffectiveFallback: "https://example.com",
      });
      expect(parsed.gs1ResolverBaseUrl.value).toBeNull();
      expect(parsed.gs1EffectiveFallback).toBe("https://example.com");
    });
  });

  describe("BrandingDtoSchema", () => {
    it("accepts a valid per-organization gs1ResolverBaseUrl override", () => {
      const parsed = BrandingDtoSchema.parse({ gs1ResolverBaseUrl: "https://id.acme.com" });
      expect(parsed.gs1ResolverBaseUrl).toBe("https://id.acme.com");
    });

    it("accepts a null/absent override", () => {
      expect(BrandingDtoSchema.parse({ gs1ResolverBaseUrl: null }).gs1ResolverBaseUrl).toBeNull();
      expect(BrandingDtoSchema.parse({}).gs1ResolverBaseUrl).toBeUndefined();
    });

    it("rejects a non-URL override", () => {
      expect(() => BrandingDtoSchema.parse({ gs1ResolverBaseUrl: "nope" })).toThrow();
    });
  });
});
