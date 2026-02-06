import type { CustomDecorator } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";

/**
 * Specifies the roles required to access a route or controller.
 * The AuthGuard will check if the authenticated user's roles
 * include at least one of the specified roles.
 * @param roles - The roles required for access
 */
export function Roles(roles: string[]): CustomDecorator {
  return SetMetadata("ROLES", roles);
}
