import { describe, expect, it } from "vitest";
import { prefilledEmailOf, sameOriginRedirectOf } from "./login-utils.ts";

describe("login utils", () => {
  describe("prefilledEmailOf", () => {
    it("returns a valid email address", () => {
      expect(prefilledEmailOf({ email: "repairer@example.com" })).toEqual("repairer@example.com");
    });

    it("ignores everything which is not an email address", () => {
      expect(prefilledEmailOf({})).toBeUndefined();
      expect(prefilledEmailOf({ email: "not-an-email" })).toBeUndefined();
      expect(prefilledEmailOf({ email: ["a@example.com", "b@example.com"] })).toBeUndefined();
    });
  });

  describe("sameOriginRedirectOf", () => {
    const origin = "https://app.open-dpp.test";

    it("returns the path, the query and the hash of a url of this application", () => {
      const redirect = encodeURIComponent(`${origin}/accept-guest-access/access-1?x=1#top`);

      expect(sameOriginRedirectOf({ redirect }, origin)).toEqual(
        "/accept-guest-access/access-1?x=1#top",
      );
    });

    it("accepts a plain path", () => {
      expect(
        sameOriginRedirectOf({ redirect: encodeURIComponent("/p/my-product") }, origin),
      ).toEqual("/p/my-product");
    });

    it("rejects other sites and protocol-relative urls", () => {
      for (const target of [
        "https://evil.example.com/x",
        "//evil.example.com/x",
        "/\\evil.example.com/x",
        "javascript:alert(1)",
        "/.//evil.example.com/x",
        "/a/..//evil.example.com/x",
      ]) {
        expect(
          sameOriginRedirectOf({ redirect: encodeURIComponent(target) }, origin),
        ).toBeUndefined();
      }
    });

    it("has nothing without a usable redirect", () => {
      expect(sameOriginRedirectOf({}, origin)).toBeUndefined();
      expect(sameOriginRedirectOf({ redirect: "" }, origin)).toBeUndefined();
      expect(sameOriginRedirectOf({ redirect: ["a", "b"] }, origin)).toBeUndefined();
      expect(sameOriginRedirectOf({ redirect: "http://[" }, origin)).toBeUndefined();
    });
  });
});
