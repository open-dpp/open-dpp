import { describe, expect, it } from "@jest/globals";
import { hashClientSecret, verifyClientSecret } from "./client-secret";

const SECRET = "landing-page-secret";

// base64url(SHA-256("landing-page-secret")): the format an older release stored.
const LEGACY_SHA256_ROW = "n7Oja6CwcOy7P2jn-_UGLdr5HtGggSf7hVXOHszy6p8";

describe("hashClientSecret", () => {
  it("does not store the secret itself", async () => {
    const stored = await hashClientSecret(SECRET);

    expect(stored).not.toContain(SECRET);
    expect(stored).not.toBe(LEGACY_SHA256_ROW);
  });

  it("salts every hash, so two hashes of one secret differ", async () => {
    const [first, second] = await Promise.all([hashClientSecret(SECRET), hashClientSecret(SECRET)]);

    expect(first).not.toBe(second);
  });
});

describe("verifyClientSecret", () => {
  it("accepts the secret the hash was made from", async () => {
    const stored = await hashClientSecret(SECRET);

    await expect(verifyClientSecret(SECRET, stored)).resolves.toBe(true);
  });

  it("rejects another secret", async () => {
    const stored = await hashClientSecret(SECRET);

    await expect(verifyClientSecret("another-secret", stored)).resolves.toBe(false);
  });

  it.each([
    ["a legacy SHA-256 row", LEGACY_SHA256_ROW],
    ["an empty stored value", ""],
    ["garbage", "not-a-hash"],
    ["garbage with the salt separator", "abc:def"],
    ["a salt without a key", "abc:"],
    ["a key without a salt", ":def"],
  ])("fails closed on %s instead of throwing", async (_label, stored) => {
    await expect(verifyClientSecret(SECRET, stored)).resolves.toBe(false);
  });

  it("lets an unexpected verifier failure surface instead of calling it a wrong secret", async () => {
    const stored = await hashClientSecret(SECRET);

    // not a format problem of the stored row: scrypt itself fails on a non-string secret
    await expect(verifyClientSecret(undefined as unknown as string, stored)).rejects.toThrow(
      TypeError,
    );
  });
});
