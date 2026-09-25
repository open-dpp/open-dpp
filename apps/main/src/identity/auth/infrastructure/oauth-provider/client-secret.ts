import { Logger } from "@nestjs/common";
import { hashPassword, verifyPassword } from "better-auth/crypto";

const logger = new Logger("TrustedClientSecret");

/** better-auth's scrypt hash as `hashPassword` writes it: `<salt>:<key>`, both non-empty. */
function isScryptHash(stored: string): boolean {
  const [salt, key, ...rest] = stored.split(":");
  return Boolean(salt) && Boolean(key) && rest.length === 0;
}

/**
 * Stores the Trusted Client secret the way User passwords are stored: better-auth's own
 * salted scrypt hasher. The app owns both halves because the startup upsert writes the
 * row and the OAuth Provider plugin verifies through `storeClientSecret.verify`.
 */
export function hashClientSecret(clientSecret: string): Promise<string> {
  return hashPassword(clientSecret);
}

/**
 * `false` for a wrong secret and for a stored value in any other format (for example a
 * row written by an older release): the plugin then answers `invalid_client`. Any other
 * failure of the verifier propagates, so the plugin answers 500 and still issues nothing.
 */
export async function verifyClientSecret(presented: string, stored: string): Promise<boolean> {
  if (!isScryptHash(stored)) {
    logger.warn(
      "The stored Trusted Client secret is not a scrypt hash (a row written by an older release?); restarting open-dpp rewrites it.",
    );
    return false;
  }
  return verifyPassword({ hash: stored, password: presented });
}
