import type { Subject } from "../lib/aas-security.ts";
import { MemberRoleDto, UserRoleDto } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import { isEqualSubject } from "../lib/aas-security.ts";

export function useRoleHierarchy() {
  const { t } = useI18n();
  const roleHierarchy = [
    { name: t("user.admin"), key: { userRole: UserRoleDto.ADMIN } }, // instance admin, the organization role is not relevant
    {
      name: t("organizations.owner"),
      key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER },
    }, // organization owner
    {
      name: t("organizations.member"),
      key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
    }, // organization member
    { name: t("user.public"), key: { userRole: UserRoleDto.ANONYMOUS } }, // anonymous user without an account
  ];

  function getRoleIndex(subject: Subject) {
    return roleHierarchy.findIndex((role) => {
      return isEqualSubject(role.key, subject);
    });
  }

  function getVisibleRoles(subject: Subject) {
    const roleIndex = getRoleIndex(subject);
    if (roleIndex === -1) {
      return [];
    }
    return roleHierarchy.slice(roleIndex);
  }

  function getRoleName(subject: Subject) {
    const roleIndex = getRoleIndex(subject);
    return roleIndex !== -1 && roleHierarchy[roleIndex]
      ? roleHierarchy[roleIndex].name
      : t("aasEditor.security.unknownRole");
  }

  function canEditPermissionsOfRole(subject: Subject, target: Subject) {
    const subjectRoles = getRoleIndex(subject);
    const targetRoles = getRoleIndex(target);
    return subjectRoles < targetRoles;
  }

  return { hierarchy: roleHierarchy, getVisibleRoles, canEditPermissionsOfRole, getRoleName };
}
