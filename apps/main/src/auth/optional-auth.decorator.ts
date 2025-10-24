import type { CustomDecorator } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";

/**
 * Marks a route or controller as having optional authentication.
 * When applied, the AuthGuard allows the request to proceed
 * even if no session is present.
 */
export function OptionalAuth(): CustomDecorator<string> {
  return SetMetadata("OPTIONAL", true);
}
