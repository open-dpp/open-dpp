import type { CustomDecorator } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";

/**
 * Allows unauthenticated (anonymous) access to a route or controller.
 * When applied, the AuthGuard will not perform authentication checks.
 */
export function AllowAnonymous(): CustomDecorator<string> {
  return SetMetadata("PUBLIC", true);
}

/**
 * @deprecated Use AllowAnonymous() instead.
 */
export const Public = AllowAnonymous;
