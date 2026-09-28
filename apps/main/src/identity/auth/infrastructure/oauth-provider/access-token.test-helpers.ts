import { generateKeyPairSync, KeyObject, randomUUID, sign } from "node:crypto";

/**
 * An Ed25519 signing key in the shape the jwt plugin publishes on `/jwks`, generated
 * with Node's own crypto so specs can mint access tokens without the provider (and
 * without a `jose` dependency).
 */
export interface SigningKey {
  kid: string;
  privateKey: KeyObject;
  /** What `auth.api.getJwks()` answers for this key. */
  jwks: { keys: Record<string, unknown>[] };
}

export function createSigningKey(): SigningKey {
  const kid = randomUUID();
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const jwk = publicKey.export({ format: "jwk" });
  return { kid, privateKey, jwks: { keys: [{ alg: "EdDSA", use: "sig", ...jwk, kid }] } };
}

function base64url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

/** An EdDSA JWS exactly as the OAuth Provider mints it: `alg` and `kid` in the header, no `typ`. */
export function signAccessToken(key: SigningKey, payload: Record<string, unknown>): string {
  const encodedHeader = base64url(JSON.stringify({ alg: "EdDSA", kid: key.kid }));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(null, Buffer.from(signingInput), key.privateKey);
  return `${signingInput}.${base64url(signature)}`;
}

export const NOW_SECONDS = () => Math.floor(Date.now() / 1000);

export interface AccessTokenSpec {
  issuer: string;
  clientId: string;
  userId: string;
  /** Any further entry overrides the claim of that name (`undefined` drops it). */
  [claim: string]: unknown;
}

/** The claim set of a Trusted Client access token for `open-dpp:api`, as the provider mints it. */
export function accessTokenClaims(spec: AccessTokenSpec): Record<string, unknown> {
  const { issuer, clientId, userId, ...rest } = spec;
  const now = NOW_SECONDS();
  return {
    iss: issuer,
    sub: userId,
    aud: [issuer, `${issuer}/oauth2/userinfo`],
    azp: clientId,
    scope: "openid profile email offline_access open-dpp:api",
    iat: now,
    exp: now + 15 * 60,
    ...rest,
  };
}
