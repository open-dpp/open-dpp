import { createHmac } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { signRevokeToken, verifyRevokeToken } from "./revoke-token";

const SECRET = "test-secret-32-chars-min-........";

function signRawPayload(payload: unknown, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

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

  it("rejects a validly-signed payload whose userId is not a string", () => {
    const token = signRawPayload(
      { userId: { $ne: null }, requestId: "req-1", exp: Date.now() + 60_000 },
      SECRET,
    );
    expect(() => verifyRevokeToken(token, SECRET)).toThrow(ValueError);
  });

  it("rejects a validly-signed payload whose requestId is not a string", () => {
    const token = signRawPayload(
      { userId: "user-1", requestId: { $ne: null }, exp: Date.now() + 60_000 },
      SECRET,
    );
    expect(() => verifyRevokeToken(token, SECRET)).toThrow(ValueError);
  });
});
