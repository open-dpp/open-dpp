import { oauthProvider } from "@better-auth/oauth-provider";
import type { EnvService, TrustedClientEnv } from "@open-dpp/env";
import { jwt } from "better-auth/plugins";
import {
  ACCESS_TOKEN_LIFETIME_SECONDS,
  OAUTH_PROVIDER_GRANT_TYPES,
  OAUTH_PROVIDER_SCOPES,
  REFRESH_TOKEN_LIFETIME_SECONDS,
} from "../../domain/trusted-client-access-token";
import { hashClientSecret, verifyClientSecret } from "./client-secret";
import { oauthProviderIssuer } from "./oauth-provider-issuer";
import { OAUTH_PROVIDER_CLAIMS_SUPPORTED, profileClaims } from "./trusted-client-claims";

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
      refreshTokenExpiresIn: REFRESH_TOKEN_LIFETIME_SECONDS,
      // freezes the Trusted Client against the (already disabled) CRUD endpoints
      cachedTrustedClients: new Set([trustedClient.clientId]),
      storeClientSecret: { hash: hashClientSecret, verify: verifyClientSecret },
      // standard profile claims from the User's own fields; both hooks run scope-agnostic
      customIdTokenClaims: ({ user, scopes }) => profileClaims(user, scopes),
      customUserInfoClaims: ({ user, scopes }) => profileClaims(user, scopes),
      advertisedMetadata: { claims_supported: [...OAUTH_PROVIDER_CLAIMS_SUPPORTED] },
      // the RFC 8414 root alias sits outside the /api prefix and is deliberately unserved
      silenceWarnings: { oauthAuthServerConfig: true },
    }),
  ];
}

/** What the OAuth Provider adds to the better-auth options: nothing while it is disabled. */
export interface OAuthProviderAuthOptions {
  /** Top-level `disabledPaths`; absent while disabled, so the options stay unchanged. */
  readonly disabledPaths?: string[];
  readonly plugins: ReturnType<typeof createOAuthProviderPlugins>;
}

/**
 * The better-auth wiring of the OAuth Provider, read from env: the plugins and the
 * lockdown while enabled, nothing while disabled (no endpoints, no collections touched).
 */
export function oauthProviderAuthOptions(configService: EnvService): OAuthProviderAuthOptions {
  const trustedClient = configService.getTrustedClient();
  if (!trustedClient) {
    return { plugins: [] };
  }
  return {
    disabledPaths: [...OAUTH_PROVIDER_DISABLED_PATHS],
    plugins: createOAuthProviderPlugins(trustedClient, oauthProviderIssuer(configService)),
  };
}
