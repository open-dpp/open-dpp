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
