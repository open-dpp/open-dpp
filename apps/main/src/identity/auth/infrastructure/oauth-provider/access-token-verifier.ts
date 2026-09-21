import { verifyJwsAccessToken } from "better-auth/oauth2";
import { OPEN_DPP_API_SCOPE } from "./oauth-provider.plugins";

type VerifyJwsOptions = Parameters<typeof verifyJwsAccessToken>[1];
/** A DB-backed key-set source such as the jwt plugin's `auth.api.getJwks()`; never a URL. */
export type JwksFetch = Exclude<VerifyJwsOptions["jwksFetch"], string>;
type AccessTokenPayload = Awaited<ReturnType<typeof verifyJwsAccessToken>>;

export interface AccessTokenVerifierOptions {
  /** `iss` of every token and the audience the Trusted Client requests with `resource=`. */
  issuer: string;
  /** The Trusted Client's id: the only accepted `azp`. */
  clientId: string;
  jwksFetch: JwksFetch;
}

/** What a verified access token grants: the User it acts as, until the token expires. */
export interface VerifiedAccessToken {
  userId: string;
  expiresAt: Date;
}

export type AccessTokenVerification =
  | { status: "verified"; token: VerifiedAccessToken }
  | { status: "rejected"; reason: string };

/** Resolves for every token, good or bad; throws only when the key set cannot be read. */
export type AccessTokenVerifier = (token: string) => Promise<AccessTokenVerification>;

const ACCESS_TOKEN_ALGORITHMS = ["EdDSA"];

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

/**
 * The signing keys could not be loaded: an outage of the instance, not a verdict on
 * the token. Distinguished from a rejection so it is never mistaken for a bad token.
 */
export class KeySetUnavailableError extends Error {
  constructor(cause: unknown) {
    super(`Trusted Client key set unavailable: ${describeError(cause)}`);
    this.name = "KeySetUnavailableError";
  }
}

function rejected(reason: string): AccessTokenVerification {
  return { status: "rejected", reason };
}

/**
 * The checks the OAuth Provider's own introspection applies after the signature,
 * issuer, audience and expiry checks: the token must be authorized for the Trusted
 * Client, act for a User (a client-credentials token has no subject) and carry the
 * umbrella scope. Exported for unit tests.
 */
export function checkTrustedClientClaims(
  payload: AccessTokenPayload,
  clientId: string,
): AccessTokenVerification {
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    return rejected("no subject: not a User's token");
  }
  if (payload.azp !== clientId) {
    return rejected("authorized party is not the Trusted Client");
  }
  const scopes = typeof payload.scope === "string" ? payload.scope.split(" ") : [];
  if (!scopes.includes(OPEN_DPP_API_SCOPE)) {
    return rejected(`scope ${OPEN_DPP_API_SCOPE} not granted`);
  }
  if (typeof payload.exp !== "number") {
    return rejected("no expiry");
  }
  return {
    status: "verified",
    token: { userId: payload.sub, expiresAt: new Date(payload.exp * 1000) },
  };
}

/** Tags every key-set failure so it can be told apart from the token errors around it. */
function guardedKeySetFetch(jwksFetch: JwksFetch): JwksFetch {
  return async () => {
    let keySet: Awaited<ReturnType<JwksFetch>>;
    try {
      keySet = await jwksFetch();
    } catch (error) {
      throw new KeySetUnavailableError(error);
    }
    if (!keySet) {
      throw new KeySetUnavailableError("empty key set");
    }
    return keySet;
  };
}

/**
 * Verifies Trusted Client access tokens in-process, the way the OAuth Provider's
 * introspect and revoke endpoints do: `verifyJwsAccessToken` from `better-auth/oauth2`
 * checks signature (EdDSA), issuer, audience and expiry against the key set the jwt
 * plugin publishes; the Trusted Client checks follow. Nothing leaves the process.
 */
export function createAccessTokenVerifier(
  options: AccessTokenVerifierOptions,
): AccessTokenVerifier {
  // stable per verifier: the key set is cached for five minutes and refetched on an unknown key id
  const jwksCacheKey = {};
  const jwksFetch = guardedKeySetFetch(options.jwksFetch);
  const verifyOptions = {
    issuer: options.issuer,
    audience: options.issuer,
    algorithms: ACCESS_TOKEN_ALGORITHMS,
  };
  return async (token) => {
    try {
      const payload = await verifyJwsAccessToken(token, { jwksFetch, jwksCacheKey, verifyOptions });
      return checkTrustedClientClaims(payload, options.clientId);
    } catch (error) {
      if (error instanceof KeySetUnavailableError) {
        throw error;
      }
      return rejected(describeError(error));
    }
  };
}
