import { randomUUID } from "node:crypto";

/**
 * Enables the OAuth Provider for the spec that imports this module FIRST. The auth
 * module validates env while it is being imported (`EnvModule.forRoot()` runs inside
 * the module decorator), so these variables must be set before any application import.
 * Jest hands every test file its own copy of `process.env`, so nothing leaks.
 */
export const TEST_TRUSTED_CLIENT = {
  // unique per process: the plugin caches trusted clients process-wide by client id
  clientId: `landing-page-${randomUUID()}`,
  clientSecret: "landing-page-secret",
  redirectUris: ["https://landing.example.com/auth/callback"],
};

process.env.OPEN_DPP_OAUTH_PROVIDER_ENABLED = "true";
process.env.OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID = TEST_TRUSTED_CLIENT.clientId;
process.env.OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET = TEST_TRUSTED_CLIENT.clientSecret;
process.env.OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS = TEST_TRUSTED_CLIENT.redirectUris.join(",");
// unset: the client name must default to the client id whatever the developer's env says
process.env.OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME = "";
