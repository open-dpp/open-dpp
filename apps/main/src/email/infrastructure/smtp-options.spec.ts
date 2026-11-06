import { describe, expect, it } from "@jest/globals";
import { EnvService } from "@open-dpp/env";
import { buildSmtpOptions } from "./smtp-options";

const env = (values: Record<string, unknown>) =>
  ({ get: (key: string) => values[key] }) as unknown as EnvService;

describe("buildSmtpOptions", () => {
  it("uses STARTTLS-capable plain connection on the default port 587", () => {
    const options = buildSmtpOptions(
      env({ OPEN_DPP_MAIL_HOST: "smtp.example.com", OPEN_DPP_MAIL_PORT: 587 }),
    );

    expect(options).toEqual({ host: "smtp.example.com", port: 587, secure: false });
  });

  it("switches to implicit TLS on port 465", () => {
    const options = buildSmtpOptions(
      env({ OPEN_DPP_MAIL_HOST: "smtp.example.com", OPEN_DPP_MAIL_PORT: 465 }),
    );

    expect(options.secure).toBe(true);
  });

  it("adds credentials only when a user is configured", () => {
    const options = buildSmtpOptions(
      env({
        OPEN_DPP_MAIL_HOST: "smtp.example.com",
        OPEN_DPP_MAIL_PORT: 587,
        OPEN_DPP_MAIL_USER: "mailer",
        OPEN_DPP_MAIL_PASSWORD: "s3cret",
      }),
    );

    expect(options.auth).toEqual({ user: "mailer", pass: "s3cret" });
  });
});
