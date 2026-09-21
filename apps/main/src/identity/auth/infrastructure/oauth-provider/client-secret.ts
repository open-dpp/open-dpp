import { createHash } from "node:crypto";

/**
 * Stores a Trusted Client secret exactly like the OAuth Provider plugin's default
 * (`storeClientSecret: "hashed"`): unpadded base64url of SHA-256. The app owns the
 * function so the startup upsert writes the same hash the plugin verifies against.
 */
export function hashClientSecret(clientSecret: string): string {
  return createHash("sha256").update(clientSecret).digest("base64url");
}
