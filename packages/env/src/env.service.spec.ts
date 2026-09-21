import { describe, expect, it } from "@jest/globals";
import type { ConfigService } from "@nestjs/config";
import { EnvService } from "./env.service";

function envServiceFor(env: Record<string, unknown>): EnvService {
  const configService = { get: (key: string) => env[key] } as unknown as ConfigService;
  return new EnvService(configService);
}

describe("EnvService.getTrustedClient", () => {
  const trustedClientEnv = {
    OPEN_DPP_OAUTH_PROVIDER_ENABLED: true,
    OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID: "landing-page",
    OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET: "landing-page-secret",
    OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS: ["https://landing.example.com/auth/callback"],
  };

  it("returns undefined while the OAuth Provider is disabled", () => {
    const service = envServiceFor({
      OPEN_DPP_OAUTH_PROVIDER_ENABLED: false,
      OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID: "landing-page",
    });

    expect(service.getTrustedClient()).toBeUndefined();
  });

  it("returns the Trusted Client while the OAuth Provider is enabled", () => {
    const service = envServiceFor({
      ...trustedClientEnv,
      OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME: "Landing page",
    });

    expect(service.getTrustedClient()).toEqual({
      clientId: "landing-page",
      clientSecret: "landing-page-secret",
      redirectUris: ["https://landing.example.com/auth/callback"],
      clientName: "Landing page",
    });
  });

  it("leaves the client name out when it is not configured", () => {
    expect(envServiceFor(trustedClientEnv).getTrustedClient()).toEqual({
      clientId: "landing-page",
      clientSecret: "landing-page-secret",
      redirectUris: ["https://landing.example.com/auth/callback"],
    });
  });

  it("treats an empty client name as unset", () => {
    // ConfigService.get falls back to the raw process.env value when the validated one is
    // undefined, so `OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME=` arrives here as ""
    const service = envServiceFor({ ...trustedClientEnv, OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME: "" });

    expect(service.getTrustedClient()).toEqual({
      clientId: "landing-page",
      clientSecret: "landing-page-secret",
      redirectUris: ["https://landing.example.com/auth/callback"],
    });
  });

  it("refuses an enabled provider whose Trusted Client is incomplete", () => {
    const { OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET: _, ...incomplete } = trustedClientEnv;

    expect(() => envServiceFor(incomplete).getTrustedClient()).toThrow(
      /OPEN_DPP_OAUTH_PROVIDER_ENABLED/,
    );
  });
});
