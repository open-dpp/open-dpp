import { describe, expect, it } from "@jest/globals";
import { validateEnv } from "./env";

const baseEnv = {
  OPEN_DPP_URL: "https://dpp.example.com",
  OPEN_DPP_MONGODB_URI: "mongodb://localhost:27017",
  OPEN_DPP_MONGODB_USER: "admin",
  OPEN_DPP_MONGODB_PASSWORD: "admin",
  OPEN_DPP_MONGODB_DATABASE: "open-dpp",
  OPEN_DPP_S3_ENDPOINT: "localhost",
  OPEN_DPP_S3_PORT: "9000",
  OPEN_DPP_S3_SSL: "false",
  OPEN_DPP_S3_ACCESS_KEY: "rustfsadmin",
  OPEN_DPP_S3_SECRET_KEY: "rustfsadmin",
  OPEN_DPP_CLAMAV_URL: "http://localhost:3310",
  OPEN_DPP_MAIL_HOST: "localhost",
  OPEN_DPP_MAIL_PORT: "1025",
  OPEN_DPP_MAIL_USER: "admin",
  OPEN_DPP_MAIL_PASSWORD: "admin",
  OPEN_DPP_MAIL_SENDER_ADDRESS: "test@example.com",
  OPEN_DPP_AUTH_SECRET: "test-secret",
};

describe("validateEnv — OPEN_DPP_URL", () => {
  it("accepts a bare origin", () => {
    expect(() =>
      validateEnv({ ...baseEnv, OPEN_DPP_URL: "https://dpp.example.com" }),
    ).not.toThrow();
  });

  it("accepts a bare origin with port", () => {
    expect(() => validateEnv({ ...baseEnv, OPEN_DPP_URL: "http://localhost:3000" })).not.toThrow();
  });

  it("rejects when OPEN_DPP_URL includes a path", () => {
    expect(() => validateEnv({ ...baseEnv, OPEN_DPP_URL: "https://dpp.example.com/p" })).toThrow(
      /OPEN_DPP_URL/,
    );
  });

  it("rejects when OPEN_DPP_URL includes a query string", () => {
    expect(() =>
      validateEnv({ ...baseEnv, OPEN_DPP_URL: "https://dpp.example.com?foo=bar" }),
    ).toThrow(/OPEN_DPP_URL/);
  });

  it("rejects when OPEN_DPP_URL includes a fragment", () => {
    expect(() => validateEnv({ ...baseEnv, OPEN_DPP_URL: "https://dpp.example.com#frag" })).toThrow(
      /OPEN_DPP_URL/,
    );
  });
});

describe("validateEnv — OPEN_DPP_CLAMAV_URL", () => {
  it("accepts a URL with port", () => {
    expect(validateEnv(baseEnv).OPEN_DPP_CLAMAV_URL).toBe("http://localhost:3310");
  });

  it("is optional (virus scanning disabled when omitted)", () => {
    const { OPEN_DPP_CLAMAV_URL: _, ...withoutClamAv } = baseEnv;
    expect(validateEnv(withoutClamAv).OPEN_DPP_CLAMAV_URL).toBeUndefined();
  });

  it("treats an empty string as omitted", () => {
    expect(
      validateEnv({ ...baseEnv, OPEN_DPP_CLAMAV_URL: "" }).OPEN_DPP_CLAMAV_URL,
    ).toBeUndefined();
  });

  it("rejects a value without scheme", () => {
    expect(() => validateEnv({ ...baseEnv, OPEN_DPP_CLAMAV_URL: "clamav-rest:9000" })).toThrow(
      /OPEN_DPP_CLAMAV_URL/,
    );
  });
});

describe("validateEnv — OPEN_DPP_OAUTH_PROVIDER_* (Trusted Client)", () => {
  const trustedClientEnv = {
    OPEN_DPP_OAUTH_PROVIDER_ENABLED: "true",
    OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID: "landing-page",
    OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET: "landing-page-secret",
    OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS:
      "https://landing.example.com/auth/callback, https://landing.example.com/auth/callback-2",
  };

  it("is disabled by default", () => {
    const env = validateEnv(baseEnv);

    expect(env.OPEN_DPP_OAUTH_PROVIDER_ENABLED).toBe(false);
    expect(env.OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS).toBeUndefined();
  });

  it("rejects a non-boolean enabled flag", () => {
    expect(() => validateEnv({ ...baseEnv, OPEN_DPP_OAUTH_PROVIDER_ENABLED: "yes" })).toThrow(
      /OPEN_DPP_OAUTH_PROVIDER_ENABLED/,
    );
  });

  it("ignores an incomplete Trusted Client while disabled", () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        OPEN_DPP_OAUTH_PROVIDER_ENABLED: "false",
        OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID: "landing-page",
      }),
    ).not.toThrow();
  });

  it("parses the Trusted Client when enabled and complete", () => {
    const env = validateEnv({ ...baseEnv, ...trustedClientEnv });

    expect(env.OPEN_DPP_OAUTH_PROVIDER_ENABLED).toBe(true);
    expect(env.OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID).toBe("landing-page");
    expect(env.OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET).toBe("landing-page-secret");
    expect(env.OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS).toEqual([
      "https://landing.example.com/auth/callback",
      "https://landing.example.com/auth/callback-2",
    ]);
    expect(env.OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME).toBeUndefined();
  });

  it("keeps the optional client name", () => {
    const env = validateEnv({
      ...baseEnv,
      ...trustedClientEnv,
      OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME: "Landing page",
    });

    expect(env.OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME).toBe("Landing page");
  });

  it.each([
    "OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID",
    "OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET",
    "OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS",
  ] as const)(
    "rejects an enabled provider without %s",
    (missingKey: keyof typeof trustedClientEnv) => {
      const { [missingKey]: _, ...incomplete } = trustedClientEnv;

      expect(() => validateEnv({ ...baseEnv, ...incomplete })).toThrow(
        /OPEN_DPP_OAUTH_PROVIDER_ENABLED/,
      );
    },
  );

  it("rejects an enabled provider with an empty client secret", () => {
    expect(() =>
      validateEnv({ ...baseEnv, ...trustedClientEnv, OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET: "" }),
    ).toThrow(/OPEN_DPP_OAUTH_PROVIDER_ENABLED/);
  });

  it("accepts an http redirect URI on loopback for local development", () => {
    const env = validateEnv({
      ...baseEnv,
      ...trustedClientEnv,
      OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS: "http://localhost:3001/auth/callback",
    });

    expect(env.OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS).toEqual([
      "http://localhost:3001/auth/callback",
    ]);
  });

  it.each([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
    "http://dev.localhost",
  ])(
    "accepts an enabled provider on the http loopback origin %s for local development",
    (origin: string) => {
      expect(() =>
        validateEnv({ ...baseEnv, ...trustedClientEnv, OPEN_DPP_URL: origin }),
      ).not.toThrow();
    },
  );

  it("rejects an enabled provider on a plain http origin off loopback", () => {
    expect(() =>
      validateEnv({ ...baseEnv, ...trustedClientEnv, OPEN_DPP_URL: "http://dpp.example.com" }),
    ).toThrow(/OPEN_DPP_URL/);
  });

  it("ignores a plain http origin while disabled", () => {
    expect(() => validateEnv({ ...baseEnv, OPEN_DPP_URL: "http://dpp.example.com" })).not.toThrow();
  });

  it.each([
    ["a relative path", "https://landing.example.com/auth/callback,/auth/callback"],
    ["a plain http URL off loopback", "http://landing.example.com/auth/callback"],
    ["a fragment", "https://landing.example.com/auth/callback#fragment"],
    ["an empty list", " , "],
  ])("rejects a redirect URI list with %s", (_label: string, redirectUris: string) => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        ...trustedClientEnv,
        OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS: redirectUris,
      }),
    ).toThrow(/OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS/);
  });
});
