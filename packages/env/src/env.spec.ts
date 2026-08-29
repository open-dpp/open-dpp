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
  OPEN_DPP_S3_ACCESS_KEY: "minioadmin",
  OPEN_DPP_S3_SECRET_KEY: "minioadmin",
  OPEN_DPP_CLAMAV_URL: "http://localhost",
  OPEN_DPP_CLAMAV_PORT: "3310",
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

describe("validateEnv — mail", () => {
  it("boots without any OPEN_DPP_MAIL_* variable and defaults the port to 587", () => {
    const env = validateEnv(baseEnv);
    expect(env.OPEN_DPP_MAIL_HOST).toBeUndefined();
    expect(env.OPEN_DPP_MAIL_PORT).toBe(587);
    expect(env.OPEN_DPP_MAIL_USER).toBeUndefined();
    expect(env.OPEN_DPP_MAIL_SENDER_ADDRESS).toBeUndefined();
  });

  it("treats an empty OPEN_DPP_MAIL_HOST like unset", () => {
    const env = validateEnv({ ...baseEnv, OPEN_DPP_MAIL_HOST: "" });
    expect(env.OPEN_DPP_MAIL_HOST).toBeUndefined();
  });

  it("requires OPEN_DPP_MAIL_SENDER_ADDRESS once a host is set", () => {
    expect(() => validateEnv({ ...baseEnv, OPEN_DPP_MAIL_HOST: "smtp.example.com" })).toThrow(
      /OPEN_DPP_MAIL_SENDER_ADDRESS/,
    );
  });

  it("accepts a host with a sender and no credentials", () => {
    const env = validateEnv({
      ...baseEnv,
      OPEN_DPP_MAIL_HOST: "smtp.example.com",
      OPEN_DPP_MAIL_SENDER_ADDRESS: "noreply@example.com",
    });
    expect(env.OPEN_DPP_MAIL_HOST).toBe("smtp.example.com");
    expect(env.OPEN_DPP_MAIL_USER).toBeUndefined();
    expect(env.OPEN_DPP_MAIL_PASSWORD).toBeUndefined();
  });

  it("parses an explicit port", () => {
    const env = validateEnv({
      ...baseEnv,
      OPEN_DPP_MAIL_HOST: "smtp.example.com",
      OPEN_DPP_MAIL_PORT: "465",
      OPEN_DPP_MAIL_SENDER_ADDRESS: "noreply@example.com",
    });
    expect(env.OPEN_DPP_MAIL_PORT).toBe(465);
  });

  it("drops the Mailpit-only variables from the validated env", () => {
    const env = validateEnv({ ...baseEnv, OPEN_DPP_MAIL_MAILPIT_SMTP_AUTH: "admin:admin" });
    expect(env).not.toHaveProperty("OPEN_DPP_MAIL_MAILPIT_SMTP_AUTH");
  });
});

describe("validateEnv — OPEN_DPP_INSTANCE_MAIL_ENABLED", () => {
  it("is undefined when unset", () => {
    expect(validateEnv(baseEnv).OPEN_DPP_INSTANCE_MAIL_ENABLED).toBeUndefined();
  });

  it("parses the strict boolean strings", () => {
    expect(
      validateEnv({ ...baseEnv, OPEN_DPP_INSTANCE_MAIL_ENABLED: "false" })
        .OPEN_DPP_INSTANCE_MAIL_ENABLED,
    ).toBe(false);
    expect(
      validateEnv({ ...baseEnv, OPEN_DPP_INSTANCE_MAIL_ENABLED: "true" })
        .OPEN_DPP_INSTANCE_MAIL_ENABLED,
    ).toBe(true);
  });

  it("rejects anything but true/false", () => {
    expect(() => validateEnv({ ...baseEnv, OPEN_DPP_INSTANCE_MAIL_ENABLED: "yes" })).toThrow(
      /OPEN_DPP_INSTANCE_MAIL_ENABLED/,
    );
  });
});
