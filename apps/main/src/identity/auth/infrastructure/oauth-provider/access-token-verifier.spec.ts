import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
/**
 * How long better-auth waits for the key set, how long it trusts a fetched one, and how long
 * it waits after a refetch for an unseen key id before it asks again.
 */
const KEY_SET_FETCH_TIMEOUT_MS = 5_000;
const KEY_SET_CACHE_LIFETIME_MS = 5 * 60_000;
const KEY_SET_REFETCH_COOLDOWN_MS = 30_000;

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
    const jwksFetch = vi.fn(async () => key.jwks);
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
    const jwksFetch = vi
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

    describe("with the clock under control", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("any token while the key set does not answer in time", async () => {
        const hanging = createAccessTokenVerifier({
          issuer: ISSUER,
          clientId: CLIENT_ID,
          jwksFetch: () => new Promise(() => undefined),
        });

        const verdict = expect(hanging(signAccessToken(key, claims()))).rejects.toThrow(
          KeySetUnavailableError,
        );
        await vi.advanceTimersByTimeAsync(KEY_SET_FETCH_TIMEOUT_MS);

        await verdict;
      });

      it("a token with an unseen key id right after a refetch failed, while known keys keep working", async () => {
        const jwksFetch = vi
          .fn<() => Promise<{ keys: Record<string, unknown>[] }>>()
          .mockResolvedValueOnce(key.jwks)
          .mockRejectedValue(new Error("database unavailable"));
        const outlasting = createAccessTokenVerifier({
          issuer: ISSUER,
          clientId: CLIENT_ID,
          jwksFetch,
        });
        await outlasting(signAccessToken(key, claims()));
        await vi.advanceTimersByTimeAsync(KEY_SET_CACHE_LIFETIME_MS + 1);

        // the cached key set outlives a failed refetch for a while: Users keep working
        const known = await outlasting(signAccessToken(key, claims()));
        expect(known.status).toBe("verified");
        // a key that set does not hold may be a rotated one: no verdict without the key set
        await expect(outlasting(signAccessToken(createSigningKey(), claims()))).rejects.toThrow(
          KeySetUnavailableError,
        );
      });

      it("a token with an unseen key id against a fresh key set, but only on the call that refetches", async () => {
        const jwksFetch = vi
          .fn<() => Promise<{ keys: Record<string, unknown>[] }>>()
          .mockResolvedValueOnce(key.jwks)
          .mockRejectedValue(new Error("database unavailable"));
        const cooling = createAccessTokenVerifier({
          issuer: ISSUER,
          clientId: CLIENT_ID,
          jwksFetch,
        });
        await cooling(signAccessToken(key, claims()));
        const unseen = createSigningKey();

        // the refetch for the unseen key id fails: no verdict without the key set
        await expect(cooling(signAccessToken(unseen, claims()))).rejects.toThrow(
          KeySetUnavailableError,
        );
        // better-auth does not ask again yet and judges by the set it holds: an unknown key
        const duringCooldown = await cooling(signAccessToken(unseen, claims()));
        expect(duringCooldown.status).toBe("rejected");
        expect(jwksFetch).toHaveBeenCalledTimes(2);

        // the next refetch is due and fails as well
        await vi.advanceTimersByTimeAsync(KEY_SET_REFETCH_COOLDOWN_MS);
        await expect(cooling(signAccessToken(unseen, claims()))).rejects.toThrow(
          KeySetUnavailableError,
        );
        expect(jwksFetch).toHaveBeenCalledTimes(3);
      });
    });
  });
});
