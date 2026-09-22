/** Umbrella scope: act as the User with the User's own authority against the open-dpp API. */
export const OPEN_DPP_API_SCOPE = "open-dpp:api";

/** The plugin option replaces its defaults, so the standard scopes are restated. */
export const OAUTH_PROVIDER_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  OPEN_DPP_API_SCOPE,
] as const;

/** No client_credentials: machine-to-machine access stays on API keys. */
export const OAUTH_PROVIDER_GRANT_TYPES = ["authorization_code", "refresh_token"] as const;

/** 15 minutes: a JWT access token cannot be revoked, so it has to be short-lived. */
export const ACCESS_TOKEN_LIFETIME_SECONDS = 15 * 60;

/**
 * 7 days, sliding: every rotation restarts the window, so a landing-page session ends
 * after a week without use. Nothing else cuts a refresh token off once the User has
 * signed out of open-dpp, hence shorter than the plugin's 30-day default (#954).
 */
export const REFRESH_TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

/**
 * The claims the policy reads from an access token whose signature, issuer, audience
 * and expiry have already been verified. Structural on purpose: the rule does not
 * depend on the OAuth Provider plugin's types.
 */
export interface TrustedClientAccessTokenClaims {
  sub?: unknown;
  azp?: unknown;
  scope?: unknown;
  exp?: unknown;
}

/** What a verified access token grants: the User it acts as, until the token expires. */
export interface VerifiedAccessToken {
  userId: string;
  expiresAt: Date;
}

export type AccessTokenVerification =
  | { status: "verified"; token: VerifiedAccessToken }
  | { status: "rejected"; reason: string };

export function rejected(reason: string): AccessTokenVerification {
  return { status: "rejected", reason };
}

/**
 * Which tokens may act as a User: the checks the OAuth Provider's own introspection
 * applies after the signature, issuer, audience and expiry checks. The token must be
 * authorized for the Trusted Client, act for a User (a client-credentials token has no
 * subject) and carry the umbrella scope.
 */
export function checkTrustedClientClaims(
  claims: TrustedClientAccessTokenClaims,
  clientId: string,
): AccessTokenVerification {
  if (typeof claims.sub !== "string" || claims.sub.length === 0) {
    return rejected("no subject: not a User's token");
  }
  if (claims.azp !== clientId) {
    return rejected("authorized party is not the Trusted Client");
  }
  const scopes = typeof claims.scope === "string" ? claims.scope.split(" ") : [];
  if (!scopes.includes(OPEN_DPP_API_SCOPE)) {
    return rejected(`scope ${OPEN_DPP_API_SCOPE} not granted`);
  }
  if (typeof claims.exp !== "number") {
    return rejected("no expiry");
  }
  return {
    status: "verified",
    token: { userId: claims.sub, expiresAt: new Date(claims.exp * 1000) },
  };
}
