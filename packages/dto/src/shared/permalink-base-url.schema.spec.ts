import { describe, expect, it } from "@jest/globals";
import { PermalinkBaseUrlSchema } from "./permalink-base-url.schema";

describe("PermalinkBaseUrlSchema", () => {
  describe("accepts", () => {
    it.each([
      "https://passports.example.com",
      "http://localhost:3000",
      "https://passport.brand.io:8443",
      "https://xn--mller-kva.de",
      "https://example.com/",
    ])("'%s'", (input) => {
      const result = PermalinkBaseUrlSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("canonicalises a trailing slash to no slash", () => {
      const result = PermalinkBaseUrlSchema.safeParse("https://Example.com/");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("https://example.com");
      }
    });

    it("lowercases the host", () => {
      const result = PermalinkBaseUrlSchema.safeParse("https://PASS.ACME.COM");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("https://pass.acme.com");
      }
    });

    it("preserves a non-default port", () => {
      const result = PermalinkBaseUrlSchema.safeParse("https://example.com:8443");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("https://example.com:8443");
      }
    });
  });

  describe("rejects", () => {
    it.each([
      ["empty string", ""],
      ["bare hostname (no scheme)", "passports.example.com"],
      ["non-http scheme", "ftp://example.com"],
      ["data URL", "data:text/plain,hi"],
      ["path component", "https://example.com/p"],
      ["query string", "https://example.com?q=1"],
      ["fragment", "https://example.com#h"],
      ["nested path", "https://example.com/passports/foo"],
    ])("rejects %s ('%s')", (_label, input) => {
      const result = PermalinkBaseUrlSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects a value longer than 2048 chars", () => {
      const long = "https://example.com/" + "a".repeat(2030);
      const result = PermalinkBaseUrlSchema.safeParse(long);
      expect(result.success).toBe(false);
    });
  });
});
