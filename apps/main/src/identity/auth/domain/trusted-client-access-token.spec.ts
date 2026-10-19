import { describe, expect, it } from "@jest/globals";
import { checkTrustedClientClaims } from "./trusted-client-access-token";

const CLIENT_ID = "landing-page";
const USER_ID = "user-123";
/** 2027-01-15T08:00:00Z, as the OAuth Provider writes `exp`: seconds since the epoch. */
const EXPIRES_AT_SECONDS = 1_800_000_000;

function claims(overrides: Record<string, unknown> = {}) {
  return {
    sub: USER_ID,
    azp: CLIENT_ID,
    scope: "openid profile email offline_access open-dpp:api",
    exp: EXPIRES_AT_SECONDS,
    ...overrides,
  };
}

describe("Trusted Client access-token policy", () => {
  it("lets a token minted for the Trusted Client act as the User until it expires", () => {
    const result = checkTrustedClientClaims(claims(), CLIENT_ID);

    expect(result).toEqual({
      status: "verified",
      token: { userId: USER_ID, expiresAt: new Date("2027-01-15T08:00:00.000Z") },
    });
  });

  it("accepts the umbrella scope wherever it sits in the space-delimited list", () => {
    const result = checkTrustedClientClaims(claims({ scope: "open-dpp:api openid" }), CLIENT_ID);

    expect(result.status).toBe("verified");
  });

  describe("rejects", () => {
    it.each([
      [
        "a token without a subject (client-credentials shape)",
        claims({ sub: undefined }),
        /subject/,
      ],
      ["a token with an empty subject", claims({ sub: "" }), /subject/],
      ["a token whose subject is not a string", claims({ sub: 42 }), /subject/],
      [
        "a token authorized for another client",
        claims({ azp: "other-client" }),
        /authorized party/,
      ],
      ["a token without an authorized party", claims({ azp: undefined }), /authorized party/],
      [
        "a token without the open-dpp:api scope",
        claims({ scope: "openid profile email" }),
        /open-dpp:api/,
      ],
      ["a token without a scope claim", claims({ scope: undefined }), /open-dpp:api/],
      ["a token whose scope is not a string", claims({ scope: ["open-dpp:api"] }), /open-dpp:api/],
      ["a token without an expiry", claims({ exp: undefined }), /expiry/],
      ["a token whose expiry is not a number", claims({ exp: "soon" }), /expiry/],
    ])("%s", (_name, payload, reason) => {
      const result = checkTrustedClientClaims(payload, CLIENT_ID);

      expect(result).toEqual({ status: "rejected", reason: expect.stringMatching(reason) });
    });
  });
});
