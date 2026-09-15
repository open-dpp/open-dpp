import type { Auth } from "better-auth";
import { Inject, Injectable } from "@nestjs/common";
import { generateRandomString } from "better-auth/crypto";
import { AUTH } from "../../auth.provider";

/** better-auth's identifier namespace for password-reset tokens (see its `/reset-password` route). */
export const RESET_PASSWORD_IDENTIFIER_PREFIX = "reset-password:";
/** better-auth's own default for `emailAndPassword.resetPasswordTokenExpiresIn`. */
const DEFAULT_RESET_PASSWORD_TOKEN_TTL_SECONDS = 3600;
const TOKEN_LENGTH = 32;

/**
 * Mints password-reset tokens outside better-auth's `requestPasswordReset` flow.
 *
 * better-auth hands the token only to the fixed `sendResetPassword` callback, which sends
 * the generic reset mail. Callers that need the same token in a different mail (owner
 * provisioning) create it here in the exact shape better-auth expects, so its unchanged
 * `/reset-password` route consumes it: single use and rejected once expired. A round-trip
 * test pins that contract; a format change in better-auth fails closed as an invalid token.
 */
@Injectable()
export class PasswordResetTokensRepository {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  async mint(userId: string): Promise<string> {
    const context = await this.auth.$context;
    const token = generateRandomString(TOKEN_LENGTH, "a-z", "A-Z", "0-9");
    const ttlSeconds =
      context.options.emailAndPassword?.resetPasswordTokenExpiresIn ??
      DEFAULT_RESET_PASSWORD_TOKEN_TTL_SECONDS;
    await context.internalAdapter.createVerificationValue({
      identifier: `${RESET_PASSWORD_IDENTIFIER_PREFIX}${token}`,
      value: userId,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    });
    return token;
  }
}
