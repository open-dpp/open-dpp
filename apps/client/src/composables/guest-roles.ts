import type { GuestRoleDtoType } from "@open-dpp/dto";
import { GuestRoleDto, UserRoleDto } from "@open-dpp/dto";
import { useRoleHierarchy } from "./role-hierarchy.ts";

export function useGuestRoles() {
  const { getRoleName, getRoleDescription } = useRoleHierarchy();

  const subjectOf = (guestRole: GuestRoleDtoType) => ({ userRole: UserRoleDto.USER, guestRole });

  const guestRoleOptions = Object.values(GuestRoleDto).map((guestRole) => ({
    value: guestRole,
    label: getRoleName(subjectOf(guestRole)),
  }));

  const getGuestRoleName = (guestRole: GuestRoleDtoType) => getRoleName(subjectOf(guestRole));

  const getGuestRoleDescription = (guestRole: GuestRoleDtoType) =>
    getRoleDescription(subjectOf(guestRole));

  return { guestRoleOptions, getGuestRoleName, getGuestRoleDescription };
}
