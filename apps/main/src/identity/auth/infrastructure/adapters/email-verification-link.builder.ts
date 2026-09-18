import type { Auth } from "better-auth";
import { Inject, Injectable } from "@nestjs/common";
import { createEmailVerificationToken } from "better-auth/api";
import { AUTH } from "../../auth.provider";

/** Client route better-auth redirects to after a successful verification (as in UsersService). */
export const EMAIL_VERIFICATION_CALLBACK_URL = "/email-verified";
/** better-auth's own default for `emailVerification.expiresIn`. */
const DEFAULT_EXPIRES_IN_SECONDS = 3600;

/**
 * Builds the link of better-auth's standard verification mail without going through
 * `auth.api.sendVerificationEmail`. That route runs the mail callback as a background task
 * and swallows its errors, so a caller can never learn whether the mail went out. Owner
 * provisioning needs that answer for `emailSent`, so it builds the link here (same token
 * factory and URL shape as better-auth's `sendVerificationEmailFn`) and sends the mail itself.
 * better-auth's unchanged `/verify-email` route consumes the link; a round-trip test pins it.
 */
@Injectable()
export class EmailVerificationLinkBuilder {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  async build(email: string): Promise<string> {
    const context = await this.auth.$context;
    const token = await createEmailVerificationToken(
      context.secret,
      email,
      undefined,
      context.options.emailVerification?.expiresIn ?? DEFAULT_EXPIRES_IN_SECONDS,
    );
    const callbackURL = encodeURIComponent(EMAIL_VERIFICATION_CALLBACK_URL);
    return `${context.baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`;
  }
}
