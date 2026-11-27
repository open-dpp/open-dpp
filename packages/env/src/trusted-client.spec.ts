import { describe, expect, it } from "vitest";
import { isHttpsOrLoopbackUrl, parseTrustedClientEnv } from "./trusted-client";

describe("isHttpsOrLoopbackUrl", () => {
  it.each(["https://landing.example.com/cb", "http://localhost:3001/cb", "http://[::1]:3000"])(
    "accepts %s",
    (value: string) => {
      expect(isHttpsOrLoopbackUrl(value)).toBe(true);
    },
  );

  it.each(["http://landing.example.com/cb", "ftp://localhost:3000", "not a url", ""])(
    "rejects %s",
    (value: string) => {
      expect(isHttpsOrLoopbackUrl(value)).toBe(false);
    },
  );
});

describe("parseTrustedClientEnv", () => {
  const complete = {
    OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID: "landing-page",
    OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET: "landing-page-secret",
    OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS:
      "https://landing.example.com/auth/callback, https://landing.example.com/auth/callback-2",
  };

  it("parses the redirect URI list and leaves an unset client name out", () => {
    const result = parseTrustedClientEnv(complete);

    expect(result).toEqual({
      success: true,
      data: {
        clientId: "landing-page",
        clientSecret: "landing-page-secret",
        redirectUris: [
          "https://landing.example.com/auth/callback",
          "https://landing.example.com/auth/callback-2",
        ],
        clientAuthMethod: "client_secret_basic",
      },
    });
    expect(result.success && "clientName" in result.data).toBe(false);
  });

  it("treats an empty client name as unset", () => {
    const result = parseTrustedClientEnv({ ...complete, OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME: "" });

    expect(result.success && "clientName" in result.data).toBe(false);
  });

  it("keeps a configured client name", () => {
    const result = parseTrustedClientEnv({
      ...complete,
      OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME: "Landing page",
    });

    expect(result.success && result.data.clientName).toBe("Landing page");
  });

  it("has the Trusted Client authenticate with HTTP Basic unless told otherwise", () => {
    const result = parseTrustedClientEnv(complete);

    expect(result.success && result.data.clientAuthMethod).toBe("client_secret_basic");
  });

  it("registers the form-body method when the Trusted Client sends its secret that way", () => {
    const result = parseTrustedClientEnv({
      ...complete,
      OPEN_DPP_OAUTH_PROVIDER_CLIENT_AUTH_METHOD: "client_secret_post",
    });

    expect(result.success && result.data.clientAuthMethod).toBe("client_secret_post");
  });

  it("treats an empty authentication method as unset", () => {
    const result = parseTrustedClientEnv({
      ...complete,
      OPEN_DPP_OAUTH_PROVIDER_CLIENT_AUTH_METHOD: "",
    });

    expect(result.success && result.data.clientAuthMethod).toBe("client_secret_basic");
  });

  it("reports an authentication method the OAuth Provider does not offer the Trusted Client", () => {
    const result = parseTrustedClientEnv({
      ...complete,
      OPEN_DPP_OAUTH_PROVIDER_CLIENT_AUTH_METHOD: "private_key_jwt",
    });

    expect(result.success ? [] : result.issues).toEqual([
      {
        path: ["OPEN_DPP_OAUTH_PROVIDER_CLIENT_AUTH_METHOD"],
        message:
          'OPEN_DPP_OAUTH_PROVIDER_CLIENT_AUTH_METHOD must be "client_secret_basic" or "client_secret_post".',
      },
    ]);
  });

  it("reports every missing variable under its env key", () => {
    const result = parseTrustedClientEnv({});

    expect(result.success).toBe(false);
    expect(result.success ? [] : result.issues).toEqual([
      {
        path: ["OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID"],
        message:
          "OPEN_DPP_OAUTH_PROVIDER_ENABLED is set to true but OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID is not set.",
      },
      {
        path: ["OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET"],
        message:
          "OPEN_DPP_OAUTH_PROVIDER_ENABLED is set to true but OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET is not set.",
      },
      {
        path: ["OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS"],
        message:
          "OPEN_DPP_OAUTH_PROVIDER_ENABLED is set to true but OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS is not set.",
      },
    ]);
  });

  it("reports an unparseable redirect URI once", () => {
    const result = parseTrustedClientEnv({
      ...complete,
      OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS: "not a url",
    });

    expect(result.success ? [] : result.issues).toEqual([
      { path: ["OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS", 0], message: expect.any(String) },
    ]);
  });
});
