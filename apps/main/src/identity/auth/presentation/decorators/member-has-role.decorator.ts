import type { CustomDecorator } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";
import { MemberRoleType } from "../../../organizations/domain/member-role.enum";

export const MEMBER_HAS_ROLE = "MEMBER_HAS_ROLE";

/**
 * Specifies the roles required to access a route or controller.
 * The AuthGuard will check if the authenticated member's roles
 * include at least one of the specified roles.
 * @param roles - The roles required for access
 */
export function MemberHasRole(roles: MemberRoleType[]): CustomDecorator {
  return SetMetadata(MEMBER_HAS_ROLE, roles);
}
