import { describe, expect, it } from "vitest";
import {
  continuationUrl,
  isOAuthContinuation,
  oauthPromptIncludes,
  signedOAuthQuery,
} from "./oauth-continuation.ts";

describe("signedOAuthQuery", () => {
  it("returns the query up to and including the signature", () => {
    expect(signedOAuthQuery("?client_id=lp&state=s&exp=1&ba_iat=2&sig=abc")).toBe(
      "client_id=lp&state=s&exp=1&ba_iat=2&sig=abc",
    );
  });

  it("drops anything the page appended after the signature", () => {
    expect(signedOAuthQuery("?client_id=lp&sig=abc&redirect=%2F")).toBe("client_id=lp&sig=abc");
  });

  it("re-encodes the standard-base64 signature the way the provider signed it", () => {
    // the provider serialises with URLSearchParams: `+` `/` `=` percent-encoded, spaces as `+`
    expect(signedOAuthQuery("?scope=openid%20profile&sig=ab%2Bc%2Fd%3D")).toBe(
      "scope=openid+profile&sig=ab%2Bc%2Fd%3D",
    );
  });

  it("is undefined when the page was not opened by the OAuth Provider", () => {
    expect(signedOAuthQuery("")).toBeUndefined();
    expect(signedOAuthQuery("?redirect=%2Fpassports")).toBeUndefined();
  });
});

describe("isOAuthContinuation", () => {
  it("recognises the signature on a parsed route query", () => {
    expect(isOAuthContinuation({ client_id: "lp", sig: "abc" })).toBe(true);
    expect(isOAuthContinuation({ redirect: "/" })).toBe(false);
    expect(isOAuthContinuation({ sig: "" })).toBe(false);
    expect(isOAuthContinuation({ sig: null })).toBe(false);
  });
});

describe("oauthPromptIncludes", () => {
  it("reads the space-separated prompt values of the pending request", () => {
    expect(oauthPromptIncludes("?prompt=create&sig=abc", "create")).toBe(true);
    expect(oauthPromptIncludes("?prompt=login%20create&sig=abc", "create")).toBe(true);
    expect(oauthPromptIncludes("?prompt=login&sig=abc", "create")).toBe(false);
    expect(oauthPromptIncludes("?sig=abc", "create")).toBe(false);
  });
});

describe("continuationUrl", () => {
  it("is the URL the provider asks the browser to continue at", () => {
    expect(
      continuationUrl({ redirect: true, url: "https://landing.example.com/auth/callback?code=c" }),
    ).toBe("https://landing.example.com/auth/callback?code=c");
  });

  it("is undefined for any other response", () => {
    expect(continuationUrl({ redirect: false, url: "/" })).toBeUndefined();
    expect(continuationUrl({ redirect: true, url: "" })).toBeUndefined();
    expect(continuationUrl({ token: "t", user: {} })).toBeUndefined();
    expect(continuationUrl(null)).toBeUndefined();
  });
});
