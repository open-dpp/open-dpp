import { describe, expect, it, jest } from "@jest/globals";
import {
  accessTokenClaims,
  createSigningKey,
  NOW_SECONDS,
  signAccessToken,
} from "./access-token.test-helpers";
import { createAccessTokenVerifier, KeySetUnavailableError } from "./access-token-verifier";

const ISSUER = "https://dpp.example.com/api/v2/auth";
const CLIENT_ID = "landing-page";
const USER_ID = "user-123";

describe("Trusted Client access token verifier", () => {
  const key = createSigningKey();
  const verifier = createAccessTokenVerifier({
    issuer: ISSUER,
    clientId: CLIENT_ID,
    jwksFetch: async () => key.jwks,
  });

  function claims(overrides: Record<string, unknown> = {}) {
    return accessTokenClaims({
      issuer: ISSUER,
      clientId: CLIENT_ID,
      userId: USER_ID,
      ...overrides,
    });
  }

  it("verifies a token the OAuth Provider minted for the Trusted Client", async () => {
    const payload = claims();

    const result = await verifier(signAccessToken(key, payload));

    expect(result).toEqual({
      status: "verified",
      token: { userId: USER_ID, expiresAt: new Date((payload.exp as number) * 1000) },
    });
  });

  it("accepts the audience as a plain string, as minted without openid", async () => {
    const result = await verifier(signAccessToken(key, claims({ aud: ISSUER })));

    expect(result.status).toBe("verified");
  });

  it("fetches the key set once and reuses it for later tokens", async () => {
    const jwksFetch = jest.fn(async () => key.jwks);
    const cachingVerifier = createAccessTokenVerifier({
      issuer: ISSUER,
      clientId: CLIENT_ID,
      jwksFetch,
    });

    await cachingVerifier(signAccessToken(key, claims()));
    await cachingVerifier(signAccessToken(key, claims()));

    expect(jwksFetch).toHaveBeenCalledTimes(1);
  });

  it("refetches the key set for a key id it has not seen (rotation)", async () => {
    const rotated = createSigningKey();
    const jwksFetch = jest
      .fn<() => Promise<{ keys: Record<string, unknown>[] }>>()
      .mockResolvedValueOnce(key.jwks)
      .mockResolvedValueOnce({ keys: [...key.jwks.keys, ...rotated.jwks.keys] });
    const rotatingVerifier = createAccessTokenVerifier({
      issuer: ISSUER,
      clientId: CLIENT_ID,
      jwksFetch,
    });

    await rotatingVerifier(signAccessToken(key, claims()));
    const result = await rotatingVerifier(signAccessToken(rotated, claims()));

    expect(result.status).toBe("verified");
    expect(jwksFetch).toHaveBeenCalledTimes(2);
  });

  describe("rejects", () => {
    it.each([
      ["an expired token", claims({ exp: NOW_SECONDS() - 60 }), /JWTExpired/],
      [
        "a token from another issuer",
        claims({ iss: "https://other.example.com/api/v2/auth" }),
        /"iss" claim/,
      ],
      ["a token for another audience", claims({ aud: "https://other.example.com" }), /"aud" claim/],
      [
        "a token authorized for another client",
        claims({ azp: "other-client" }),
        /authorized party/,
      ],
      [
        "a token without the open-dpp:api scope",
        claims({ scope: "openid profile email" }),
        /scope/,
      ],
      ["a token without a scope claim", claims({ scope: undefined }), /scope/],
      ["a token without an expiry", claims({ exp: undefined }), /expiry/],
    ])("%s", async (_name, payload, reason) => {
      const result = await verifier(signAccessToken(key, payload));

      expect(result).toEqual({ status: "rejected", reason: expect.stringMatching(reason) });
    });

    it("a token without a subject (client-credentials shape)", async () => {
      const { sub: _sub, ...clientToken } = claims();

      const result = await verifier(signAccessToken(key, clientToken));

      expect(result).toEqual({ status: "rejected", reason: expect.stringMatching(/subject/) });
    });

    it("a token signed by a foreign key under the Trusted Client's key id", async () => {
      const foreign = { ...createSigningKey(), kid: key.kid };

      const result = await verifier(signAccessToken(foreign, claims()));

      expect(result).toEqual({ status: "rejected", reason: expect.stringMatching(/signature/i) });
    });

    it("a token signed by a key the provider never published", async () => {
      const result = await verifier(signAccessToken(createSigningKey(), claims()));

      expect(result.status).toBe("rejected");
    });

    it("a tampered payload", async () => {
      const [header, , signature] = signAccessToken(key, claims()).split(".");
      const forged = Buffer.from(JSON.stringify({ ...claims(), sub: "someone-else" })).toString(
        "base64url",
      );

      const result = await verifier(`${header}.${forged}.${signature}`);

      expect(result).toEqual({ status: "rejected", reason: expect.stringMatching(/signature/i) });
    });

    it("an unsigned token (alg none)", async () => {
      const [, payload] = signAccessToken(key, claims()).split(".");
      const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");

      const result = await verifier(`${header}.${payload}.`);

      expect(result.status).toBe("rejected");
    });

    it("a value that is not a JWT", async () => {
      const result = await verifier("not-a-jwt");

      expect(result.status).toBe("rejected");
    });
  });

  describe("cannot judge", () => {
    it("any token while the key set cannot be loaded: the outage surfaces, not a rejection", async () => {
      const failing = createAccessTokenVerifier({
        issuer: ISSUER,
        clientId: CLIENT_ID,
        jwksFetch: async () => {
          throw new Error("database unavailable");
        },
      });

      await expect(failing(signAccessToken(key, claims()))).rejects.toThrow(KeySetUnavailableError);
      await expect(failing(signAccessToken(key, claims()))).rejects.toThrow(/database unavailable/);
    });

    it("any token while the key set is empty", async () => {
      const empty = createAccessTokenVerifier({
        issuer: ISSUER,
        clientId: CLIENT_ID,
        jwksFetch: async () => undefined,
      });

      await expect(empty(signAccessToken(key, claims()))).rejects.toThrow(KeySetUnavailableError);
    });
  });
});
