import { hashPassword, verifyPassword } from "better-auth/crypto";

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
 * row written by an older release): the plugin then answers `invalid_client`, never a 500.
 */
export async function verifyClientSecret(presented: string, stored: string): Promise<boolean> {
  try {
    return await verifyPassword({ hash: stored, password: presented });
  } catch {
    return false;
  }
}
