import type { GuestRoleDtoType, MemberRoleDtoType, UserRoleDtoType } from "@open-dpp/dto";
import { GuestRoleDto, MemberRoleDto, UserRoleDto } from "@open-dpp/dto";

/**
 * The roles that identify who acts on the data of an organization: the instance wide user role,
 * and for users of an organization the member role or, for external guests, the guest role.
 */
export interface SubjectRoles {
  userRole: UserRoleDtoType;
  memberRole?: MemberRoleDtoType;
  guestRole?: GuestRoleDtoType;
}

/**
 * Ordered from the most to the least privileged level. Subjects of the same level have the same
 * rank, e.g. all guest roles. Backend and frontend rank subjects with this one definition.
 */
export const subjectHierarchy: readonly (readonly SubjectRoles[])[] = [
  [{ userRole: UserRoleDto.ADMIN }], // instance admin, the organization role is not relevant
  [{ userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER }], // organization owner
  [{ userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER }], // organization member
  Object.values(GuestRoleDto).map((guestRole) => ({ userRole: UserRoleDto.USER, guestRole })), // external guests with access granted by an organization
  [{ userRole: UserRoleDto.USER }], // user without organization membership
  [{ userRole: UserRoleDto.ANONYMOUS }], // anonymous user without an account
];

/** Two subjects are equal if their roles are equal. For admins the other roles are not relevant. */
export function isEqualSubjectRoles(a: SubjectRoles, b: SubjectRoles): boolean {
  return (
    (a.userRole === UserRoleDto.ADMIN && b.userRole === UserRoleDto.ADMIN) ||
    (a.userRole === b.userRole && a.memberRole === b.memberRole && a.guestRole === b.guestRole)
  );
}

/** The level of the subject in the hierarchy, 0 is the most privileged. -1 if it is not part of it. */
export function levelOfSubject(roles: SubjectRoles): number {
  return subjectHierarchy.findIndex((level) =>
    level.some((subject) => isEqualSubjectRoles(subject, roles)),
  );
}

/**
 * Positive if `a` ranks higher than `b`, negative if `a` ranks lower and 0 if both have the same
 * rank.
 */
export function compareSubjects(a: SubjectRoles, b: SubjectRoles): number {
  return levelOfSubject(b) - levelOfSubject(a);
}

/** All subjects on a lower level than the given one. */
export function subjectsBelow(roles: SubjectRoles): SubjectRoles[] {
  return subjectHierarchy.slice(levelOfSubject(roles) + 1).flat();
}
