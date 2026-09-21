import { oauthProvider } from "@better-auth/oauth-provider";
import type { TrustedClientEnv } from "@open-dpp/env";
import { jwt } from "better-auth/plugins";
import { hashClientSecret } from "./client-secret";

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

export const OAUTH_PROVIDER_LOGIN_PAGE = "/signin";
export const OAUTH_PROVIDER_SIGNUP_PAGE = "/signup";
/** Mandatory in the plugin's options, never rendered: the Trusted Client skips consent. */
const OAUTH_PROVIDER_CONSENT_PAGE = "/oauth/consent";

/**
 * better-auth paths switched off while the OAuth Provider is on. Client and consent
 * management stay server-side (the Trusted Client is upserted from env), RP-initiated
 * logout is out of scope, and the jwt plugin's session-to-JWT endpoint must not mint
 * tokens. better-auth matches them before any hook, for every method, and answers 404.
 */
export const OAUTH_PROVIDER_DISABLED_PATHS = [
  "/token",
  "/oauth2/register",
  "/oauth2/create-client",
  "/oauth2/update-client",
  "/oauth2/delete-client",
  "/oauth2/get-client",
  "/oauth2/get-clients",
  "/oauth2/public-client",
  "/oauth2/public-client-prelogin",
  "/oauth2/client/rotate-secret",
  "/oauth2/get-consent",
  "/oauth2/get-consents",
  "/oauth2/update-consent",
  "/oauth2/delete-consent",
  "/oauth2/end-session",
  "/oauth2/consent",
] as const;

/**
 * The jwt plugin (signing keys, `/jwks`) and the OAuth Provider plugin, configured for
 * exactly one Trusted Client. Registered only while the OAuth Provider is enabled.
 *
 * @param issuer the auth mount on the instance origin, e.g. `https://host/api/v2/auth`
 */
export function createOAuthProviderPlugins(trustedClient: TrustedClientEnv, issuer: string) {
  return [
    jwt({
      // otherwise /get-session returns a session JWT in a `set-auth-jwt` header
      disableSettingJwtHeader: true,
      jwt: { issuer },
    }),
    oauthProvider({
      loginPage: OAUTH_PROVIDER_LOGIN_PAGE,
      consentPage: OAUTH_PROVIDER_CONSENT_PAGE,
      signup: { page: OAUTH_PROVIDER_SIGNUP_PAGE },
      scopes: [...OAUTH_PROVIDER_SCOPES],
      grantTypes: [...OAUTH_PROVIDER_GRANT_TYPES],
      accessTokenExpiresIn: ACCESS_TOKEN_LIFETIME_SECONDS,
      // freezes the Trusted Client against the (already disabled) CRUD endpoints
      cachedTrustedClients: new Set([trustedClient.clientId]),
      storeClientSecret: { hash: hashClientSecret },
      // the RFC 8414 root alias sits outside the /api prefix and is deliberately unserved
      silenceWarnings: { oauthAuthServerConfig: true },
    }),
  ];
}
