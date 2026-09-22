import { verifyJwsAccessToken } from "better-auth/oauth2";
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
