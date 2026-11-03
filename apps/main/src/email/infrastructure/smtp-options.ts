import { EnvService } from "@open-dpp/env";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const IMPLICIT_TLS_PORT = 465;

/**
 * SMTP transport options from the env: port 587 (env default) with automatic
 * STARTTLS upgrade, implicit TLS on 465, and no `auth` block for
 * unauthenticated relays (OPEN_DPP_MAIL_USER unset).
 */
export function buildSmtpOptions(env: Pick<EnvService, "get">): SMTPTransport.Options {
  const port = env.get("OPEN_DPP_MAIL_PORT");
  const user = env.get("OPEN_DPP_MAIL_USER");
  return {
    host: env.get("OPEN_DPP_MAIL_HOST"),
    port,
    secure: port === IMPLICIT_TLS_PORT,
    ...(user ? { auth: { user, pass: env.get("OPEN_DPP_MAIL_PASSWORD") } } : {}),
  };
}
