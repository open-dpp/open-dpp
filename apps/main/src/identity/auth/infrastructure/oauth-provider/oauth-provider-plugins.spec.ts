import { describe, expect, it } from "vitest";
import type { EnvService, TrustedClientEnv } from "@open-dpp/env";
import { OAUTH_PROVIDER_DISABLED_PATHS, oauthProviderAuthOptions } from "./oauth-provider-plugins";

const TRUSTED_CLIENT: TrustedClientEnv = {
  clientId: "landing-page",
  clientSecret: "landing-page-secret",
  redirectUris: ["https://landing.example.com/auth/callback"],
  clientAuthMethod: "client_secret_basic",
};

/** The key set, and the flow endpoints the Trusted Client and the sign-in page use. */
const REACHABLE_PLUGIN_PATHS = [
  "/jwks",
  "/oauth2/authorize",
  "/oauth2/continue",
  "/oauth2/introspect",
  "/oauth2/revoke",
  "/oauth2/token",
  "/oauth2/userinfo",
];

/** The part of a better-auth endpoint the router reads to decide whether it serves it. */
interface RoutedEndpoint {
  path?: string;
  options?: { metadata?: { SERVER_ONLY?: boolean } };
}

/** Paths better-auth's router serves for a plugin: server-only endpoints have no route. */
function routedPaths(plugin: { endpoints?: object }): string[] {
  return Object.values((plugin.endpoints ?? {}) as Record<string, RoutedEndpoint>)
    .filter((endpoint) => !endpoint.options?.metadata?.SERVER_ONLY)
    .flatMap((endpoint) => (endpoint.path ? [endpoint.path] : []));
}

function envServiceWith(trustedClient: TrustedClientEnv | undefined): EnvService {
  return {
    getTrustedClient: () => trustedClient,
    get: (key: string) => (key === "OPEN_DPP_URL" ? "https://dpp.example.com" : undefined),
  } as unknown as EnvService;
}

describe("oauthProviderAuthOptions", () => {
  it("adds nothing to the better-auth options while the OAuth Provider is disabled", () => {
    expect(oauthProviderAuthOptions(envServiceWith(undefined))).toEqual({ plugins: [] });
  });

  it("registers the jwt and OAuth Provider plugins and locks the unused paths while enabled", () => {
    const options = oauthProviderAuthOptions(envServiceWith(TRUSTED_CLIENT));

    expect(options.disabledPaths).toEqual([...OAUTH_PROVIDER_DISABLED_PATHS]);
    expect(options.plugins.map((plugin) => plugin.id)).toEqual(["jwt", "oauth-provider"]);
  });

  // A better-auth upgrade that adds an endpoint fails here until the path is locked down or allowed.
  it("leaves only the key set and the flow endpoints of the plugins reachable", () => {
    const options = oauthProviderAuthOptions(envServiceWith(TRUSTED_CLIENT));

    const reachable = options.plugins
      .flatMap(routedPaths)
      .filter((path) => !options.disabledPaths?.includes(path));

    expect([...new Set(reachable)].sort()).toEqual(REACHABLE_PLUGIN_PATHS);
  });
});
