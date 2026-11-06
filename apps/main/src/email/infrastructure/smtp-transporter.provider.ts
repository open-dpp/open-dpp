import { Logger, Provider } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { createTransport, Transporter } from "nodemailer";
import { buildSmtpOptions } from "./smtp-options";

/** Injection token of the SMTP transporter: `null` while no SMTP host is configured. */
export const SMTP_TRANSPORTER = Symbol("SMTP_TRANSPORTER");

const logger = new Logger("SmtpTransporter");

/**
 * The SMTP transporter, or `null` while OPEN_DPP_MAIL_HOST is unset. createTransport()
 * does not connect, so building it at bootstrap is safe even when the relay is down.
 */
export function createSmtpTransporter(env: EnvService): Transporter | null {
  if (!env.isMailConfigured()) {
    logger.warn(
      "Mail is disabled (OPEN_DPP_MAIL_HOST is not set): no mail will be sent. Verification, password-reset, email-change and invitation links are written to the log instead.",
    );
    return null;
  }
  const options = buildSmtpOptions(env);
  logger.log(`Sending mail via SMTP ${options.host}:${options.port}`);
  return createTransport(options);
}

export const smtpTransporterProvider: Provider = {
  provide: SMTP_TRANSPORTER,
  useFactory: createSmtpTransporter,
  inject: [EnvService],
};
