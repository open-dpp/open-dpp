import type { CustomDecorator } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";

export const DENY_API_KEY_AUTH = "DENY_API_KEY_AUTH";

/**
 * Marks a route or controller as inaccessible to api-key-authenticated
 * requests. The AuthGuard rejects such requests with 403; only a browser
 * session (cookie or bearer token) is accepted.
 *
 * Use this on endpoints where a leaked api key must not be able to act,
 * e.g. api key management itself.
 */
export function DenyApiKeyAuth(): CustomDecorator {
  return SetMetadata(DENY_API_KEY_AUTH, true);
}
