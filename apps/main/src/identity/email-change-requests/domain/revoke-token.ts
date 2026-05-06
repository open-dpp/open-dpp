import { createHmac, timingSafeEqual } from "node:crypto";
import { ValueError } from "@open-dpp/exception";

export interface RevokeTokenPayload {
  userId: string;
  requestId: string;
}

interface SignedPayload extends RevokeTokenPayload {
  exp: number;
}

export function signRevokeToken(
  payload: RevokeTokenPayload,
  secret: string,
  ttlMs: number,
  now: Date = new Date(),
): string {
  const signed: SignedPayload = {
    userId: payload.userId,
    requestId: payload.requestId,
    exp: now.getTime() + ttlMs,
  };
  const body = Buffer.from(JSON.stringify(signed)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyRevokeToken(
  token: string,
  secret: string,
  now: Date = new Date(),
): RevokeTokenPayload {
  const parts = token.split(".");
  if (parts.length !== 2) {
    throw new ValueError("Malformed revoke token");
  }
  const [body, sig] = parts;
  const expectedSig = createHmac("sha256", secret).update(body).digest("base64url");
  if (
    sig.length !== expectedSig.length ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  ) {
    throw new ValueError("Invalid revoke token signature");
  }
  let payload: SignedPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    throw new ValueError("Malformed revoke token payload");
  }
  if (typeof payload.exp !== "number" || payload.exp < now.getTime()) {
    throw new ValueError("Revoke token expired");
  }
  return { userId: payload.userId, requestId: payload.requestId };
}
