import type { Subject } from "../lib/aas-security.ts";
import {
  MemberRoleDto,
  UserRoleDto,

} from "@open-dpp/dto";

export function useRoleHierarchy() {
  const roleHierarchy = [
    { name: "Admin", key: { userRole: UserRoleDto.ADMIN } }, // instance admin, the organization role is not relevant
    {
      name: "Owner",
      key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER },
    }, // organization owner
    {
      name: "Member",
      key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
    }, // organization member
    { name: "Public", key: { userRole: UserRoleDto.ANONYMOUS } }, // anonymous user without an account
  ];

  function getRoleIndex(subject: Subject) {
    return roleHierarchy.findIndex((role) => {
      return JSON.stringify(role.key) === JSON.stringify(subject);
    });
  }

  function getVisibleRoles(subject: Subject) {
    const roleIndex = getRoleIndex(subject);
    if (roleIndex === -1) {
      return [];
    }
    return roleHierarchy.slice(roleIndex);
  }

  function canEditPermissionsOfRole(subject: Subject, target: Subject) {
    if (subject.userRole === UserRoleDto.ADMIN) {
      return true;
    }
    const subjectRoles = getRoleIndex(subject);
    const targetRoles = getRoleIndex(target);
    return subjectRoles < targetRoles;
  }

  return { hierarchy: roleHierarchy, getVisibleRoles, canEditPermissionsOfRole };
}
