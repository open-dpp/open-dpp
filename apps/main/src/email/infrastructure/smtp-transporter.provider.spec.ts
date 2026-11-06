import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { EnvService } from "@open-dpp/env";
import { createSmtpTransporter } from "./smtp-transporter.provider";

const envWith = (values: Record<string, unknown>) =>
  new EnvService({ get: (key: string) => values[key] } as unknown as ConfigService);

describe("createSmtpTransporter", () => {
  let warn: jest.SpiedFunction<Logger["warn"]>;
  let log: jest.SpiedFunction<Logger["log"]>;

  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    log = jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns no transporter without an SMTP host and warns that links go to the log", () => {
    expect(createSmtpTransporter(envWith({}))).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/OPEN_DPP_MAIL_HOST.*log/));
  });

  it("builds an SMTP transporter once a host is set", () => {
    const transporter = createSmtpTransporter(
      envWith({ OPEN_DPP_MAIL_HOST: "smtp.example.com", OPEN_DPP_MAIL_PORT: 587 }),
    );

    expect(transporter).not.toBeNull();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("smtp.example.com:587"));
    expect(warn).not.toHaveBeenCalled();
  });
});
