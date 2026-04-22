import { describe, expect, it } from "vitest";
import { buildLegacyPresentationApiUrl } from "./legacy-presentation-redirect";

describe("buildLegacyPresentationApiUrl", () => {
  it("maps /presentation/:uuid to /api/unique-product-identifiers/:uuid", () => {
    expect(buildLegacyPresentationApiUrl("abc-123", "")).toBe(
      "/api/unique-product-identifiers/abc-123",
    );
  });

  it("preserves query string", () => {
    expect(buildLegacyPresentationApiUrl("abc-123", "?foo=bar")).toBe(
      "/api/unique-product-identifiers/abc-123?foo=bar",
    );
  });

  it("joins nested path segments (e.g. /presentation/:uuid/chat)", () => {
    expect(buildLegacyPresentationApiUrl(["abc-123", "chat"], "")).toBe(
      "/api/unique-product-identifiers/abc-123/chat",
    );
  });

  it("maps /presentation with no path to the root legacy endpoint", () => {
    expect(buildLegacyPresentationApiUrl("", "")).toBe("/api/unique-product-identifiers");
  });

  it("passes the ?reference= query string to the root legacy endpoint", () => {
    expect(buildLegacyPresentationApiUrl(undefined, "?reference=passport-1")).toBe(
      "/api/unique-product-identifiers?reference=passport-1",
    );
  });

  it("handles null path params", () => {
    expect(buildLegacyPresentationApiUrl(null, "")).toBe("/api/unique-product-identifiers");
  });

  it("encodes unsafe characters in path segments", () => {
    expect(buildLegacyPresentationApiUrl("abc 123", "")).toBe(
      "/api/unique-product-identifiers/abc%20123",
    );
  });

  it("encodes unsafe characters in nested path segments", () => {
    expect(buildLegacyPresentationApiUrl(["abc 123", "chat/extra"], "")).toBe(
      "/api/unique-product-identifiers/abc%20123/chat%2Fextra",
    );
  });
});
