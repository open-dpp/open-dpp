import type { CustomDecorator } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";

export const SESSION_ONLY = "SESSION_ONLY";

/**
 * Marks a route or controller as reachable only with a browser session. The
 * AuthGuard rejects every other credential with 403: api keys and Trusted Client
 * access tokens alike.
 *
 * Use this on endpoints where a leaked api key or a Trusted Client access token
 * must not be able to act, e.g. api key management itself.
 */
export function SessionOnly(): CustomDecorator {
  return SetMetadata(SESSION_ONLY, true);
}
