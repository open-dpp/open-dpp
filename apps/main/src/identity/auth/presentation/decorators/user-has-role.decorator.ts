import type { CustomDecorator } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../../../users/domain/user-role.enum";

export const USER_HAS_ROLE = "USER_HAS_ROLE";

/**
 * Specifies the roles required to access a route or controller.
 * The AuthGuard will check if the authenticated user's roles
 * include at least one of the specified roles.
 * @param roles - The roles required for access
 */
export function UserHasRole(roles: UserRole[]): CustomDecorator {
  return SetMetadata(USER_HAS_ROLE, roles);
}
