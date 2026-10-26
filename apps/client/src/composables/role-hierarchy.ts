import type { Subject } from "../lib/aas-security.ts";
import { MemberRoleDto, UserRoleDto } from "@open-dpp/dto";
import {
  isEqualSubjectRoles,
  levelOfSubject,
  subjectHierarchy,
  subjectsBelow,
} from "@open-dpp/permission";
import { useI18n } from "vue-i18n";

// A user who is neither member nor guest has no permissions to configure
function isPlainUser(subject: Subject) {
  return subject.userRole === UserRoleDto.USER && !subject.memberRole && !subject.guestRole;
}

export function useRoleHierarchy() {
  const { t } = useI18n();

  // The only client specific knowledge: which text belongs to which subject
  function nameOf(subject: Subject): string | undefined {
    if (subject.userRole === UserRoleDto.ADMIN) return t("user.admin"); // instance admin, the organization role is not relevant
    if (subject.userRole === UserRoleDto.ANONYMOUS) return t("user.public"); // anonymous user without an account
    if (subject.guestRole) return t(`user.guestRoles.${subject.guestRole}`); // external guest with access given by an organization
    if (subject.memberRole === MemberRoleDto.OWNER) return t("organizations.owner");
    if (subject.memberRole === MemberRoleDto.MEMBER) return t("organizations.member");
    return undefined;
  }

  // Order and levels come from the shared hierarchy, the rows are all subjects whose permissions
  // can be configured.
  const roleHierarchy = subjectHierarchy
    .flat()
    .filter((subject) => !isPlainUser(subject))
    .map((key) => ({ key, name: nameOf(key) ?? t("aasEditor.security.unknownRole") }));

  function isListed(subject: Subject) {
    return roleHierarchy.some((role) => isEqualSubjectRoles(role.key, subject));
  }

  // The subject itself and every role on a lower level, but no other role of its own level
  function getVisibleRoles(subject: Subject) {
    if (!isListed(subject)) {
      return [];
    }
    const visible = [subject, ...subjectsBelow(subject)];
    return roleHierarchy.filter((role) =>
      visible.some((subject) => isEqualSubjectRoles(subject, role.key)),
    );
  }

  function getRoleName(subject: Subject) {
    return isListed(subject)
      ? roleHierarchy.find((role) => isEqualSubjectRoles(role.key, subject))!.name
      : t("aasEditor.security.unknownRole");
  }

  function canEditPermissionsOfRole(subject: Subject, target: Subject) {
    // Only admins and members edit permissions. Guests, users without an organization and
    // anonymous users only read.
    if (subject.userRole !== UserRoleDto.ADMIN && !subject.memberRole) {
      return false;
    }
    return levelOfSubject(subject) < levelOfSubject(target);
  }

  return { hierarchy: roleHierarchy, getVisibleRoles, canEditPermissionsOfRole, getRoleName };
}
