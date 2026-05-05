import { describe, expect, it } from "@jest/globals";
import { signRevokeToken, verifyRevokeToken } from "./revoke-token";

const SECRET = "test-secret-32-chars-min-........";

describe("revoke token", () => {
  it("signs and verifies a token", () => {
    const token = signRevokeToken(
      { userId: "user-1", requestId: "req-1" },
      SECRET,
      60_000,
      new Date("2026-05-02T10:00:00Z"),
    );

    const verified = verifyRevokeToken(token, SECRET, new Date("2026-05-02T10:00:30Z"));
    expect(verified).toEqual({ userId: "user-1", requestId: "req-1" });
  });

  it("rejects a tampered payload", () => {
    const token = signRevokeToken(
      { userId: "user-1", requestId: "req-1" },
      SECRET,
      60_000,
      new Date("2026-05-02T10:00:00Z"),
    );
    const [, sig] = token.split(".");
    const tampered = `${Buffer.from(
      JSON.stringify({ userId: "attacker", requestId: "req-1", exp: Date.now() + 60_000 }),
    ).toString("base64url")}.${sig}`;

    expect(() => verifyRevokeToken(tampered, SECRET, new Date("2026-05-02T10:00:30Z"))).toThrow();
  });

  it("rejects an expired token", () => {
    const token = signRevokeToken(
      { userId: "user-1", requestId: "req-1" },
      SECRET,
      60_000,
      new Date("2026-05-02T10:00:00Z"),
    );
    expect(() => verifyRevokeToken(token, SECRET, new Date("2026-05-02T11:00:00Z"))).toThrow();
  });

  it("rejects a malformed token", () => {
    expect(() => verifyRevokeToken("not-a-token", SECRET, new Date())).toThrow();
  });
});
