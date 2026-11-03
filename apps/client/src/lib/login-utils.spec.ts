import { describe, expect, it } from "vitest";
import { hasRedirect, prefilledEmailOf, redirectUriOf } from "./login-utils.ts";

describe("login utils", () => {
  describe("redirectUriOf", () => {
    it("decodes the encoded url", () => {
      const url = "https://app.open-dpp.test/accept-guest-access/access-1?x=1";

      expect(redirectUriOf({ redirect: encodeURIComponent(url) })).toEqual(url);
    });

    it("falls back to the root", () => {
      expect(redirectUriOf({})).toEqual("/");
      expect(redirectUriOf({ redirect: "" })).toEqual("/");
      expect(redirectUriOf({ redirect: ["a", "b"] })).toEqual("/");
    });
  });

  describe("hasRedirect", () => {
    it("is true only for a non empty redirect", () => {
      expect(hasRedirect({ redirect: encodeURIComponent("/x") })).toBe(true);
      expect(hasRedirect({})).toBe(false);
      expect(hasRedirect({ redirect: "" })).toBe(false);
      expect(hasRedirect({ redirect: ["a", "b"] })).toBe(false);
    });
  });

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
});
