import { verifyJwsAccessToken } from "better-auth/oauth2";
import { describeError } from "../../../../lib/describe-error";
import {
  AccessTokenVerification,
  checkTrustedClientClaims,
  rejected,
} from "../../domain/trusted-client-access-token";

type VerifyJwsOptions = Parameters<typeof verifyJwsAccessToken>[1];
/** A DB-backed key-set source such as the jwt plugin's `auth.api.getJwks()`; never a URL. */
export type JwksFetch = Exclude<VerifyJwsOptions["jwksFetch"], string>;

export interface AccessTokenVerifierOptions {
  /** `iss` of every token and the audience the Trusted Client requests with `resource=`. */
  issuer: string;
  /** The Trusted Client's id: the only accepted `azp`. */
  clientId: string;
  jwksFetch: JwksFetch;
}

/** Resolves for every token, good or bad; throws only when the key set cannot be read. */
export type AccessTokenVerifier = (token: string) => Promise<AccessTokenVerification>;

const ACCESS_TOKEN_ALGORITHMS = ["EdDSA"];

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

/** The code of jose's error for a key set that did not arrive in time (better-auth waits five seconds). */
const KEY_SET_TIMEOUT_CODE = "ERR_JWKS_TIMEOUT";

/** The message of better-auth's plain error for a key set it does not ask for again yet. */
const KEY_SET_REFETCH_REFUSED_MESSAGE = "JWKS fetch failed";

/**
 * Whether verification gave up for want of the key set. A failing fetch is tagged by
 * `guardedKeySetFetch`. better-auth adds two verdicts of its own that carry no such tag:
 * the fetch did not answer in time, or a refetch failed moments ago and it does not try
 * again yet.
 */
function isKeySetOutage(error: unknown): boolean {
  if (error instanceof KeySetUnavailableError) {
    return true;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    (error as { code?: unknown }).code === KEY_SET_TIMEOUT_CODE ||
    error.message === KEY_SET_REFETCH_REFUSED_MESSAGE
  );
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
 * plugin publishes; the domain's Trusted Client policy follows. Nothing leaves the process.
 */
export function createAccessTokenVerifier(
  options: AccessTokenVerifierOptions,
): AccessTokenVerifier {
  // stable per verifier: the key set is cached for five minutes, refetched on an unknown key id
  // (at most every 30 seconds) and trusted for ten minutes while a refetch fails
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
      if (isKeySetOutage(error)) {
        throw error instanceof KeySetUnavailableError ? error : new KeySetUnavailableError(error);
      }
      return rejected(describeError(error));
    }
  };
}
