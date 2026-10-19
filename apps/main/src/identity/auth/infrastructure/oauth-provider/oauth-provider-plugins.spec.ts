import { describe, expect, it } from "@jest/globals";
import type { EnvService, TrustedClientEnv } from "@open-dpp/env";
import { OAUTH_PROVIDER_DISABLED_PATHS, oauthProviderAuthOptions } from "./oauth-provider-plugins";

const TRUSTED_CLIENT: TrustedClientEnv = {
  clientId: "landing-page",
  clientSecret: "landing-page-secret",
  redirectUris: ["https://landing.example.com/auth/callback"],
};

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
});
