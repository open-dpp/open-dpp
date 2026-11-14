import type { PermissionType } from "@open-dpp/dto";
import type { SubjectRoles } from "./subject-hierarchy";
import { UserRoleDto } from "@open-dpp/dto";
import { isEqualSubjectRoles } from "./subject-hierarchy";

/** What one rule says about one object: the permissions a subject is granted on it. */
export interface PermissionEntry {
  subject: SubjectRoles;
  /** The path of the object, segments separated by a dot. */
  object: string;
  permissions: readonly PermissionType[];
}

/** Whose entry decided: an entry of the subject itself, or one of the public as a fallback. */
export const PermissionEntryOrigin = {
  OWN: "own",
  PUBLIC: "public",
} as const;
export type PermissionEntryOriginType =
  (typeof PermissionEntryOrigin)[keyof typeof PermissionEntryOrigin];

export interface ResolvedPermissionEntry {
  permissions: PermissionType[];
  /** The object the deciding entry belongs to: the object itself or one of its parents. */
  at: string;
  from: PermissionEntryOriginType;
}

const PUBLIC: SubjectRoles = { userRole: UserRoleDto.ANONYMOUS };

/**
 * Admins, owners, members and guests fall back to the rules of the public for objects which none
 * of their own rules covers. The public itself and a user without an organization do not.
 */
export function subjectFallsBackToPublic(subject: SubjectRoles): boolean {
  return (
    subject.userRole === UserRoleDto.ADMIN ||
    subject.memberRole !== undefined ||
    subject.guestRole !== undefined
  );
}

// The object itself first, then each parent: "a.b.c", "a.b", "a"
function pathsOf(object: string): string[] {
  const segments = object.split(".");
  return segments.map((_, index) => segments.slice(0, segments.length - index).join("."));
}

function resolveAlongPath(
  entries: readonly PermissionEntry[],
  subject: SubjectRoles,
  object: string,
): { permissions: PermissionType[]; at: string } | undefined {
  for (const path of pathsOf(object)) {
    const entry = entries.find((e) => e.object === path && isEqualSubjectRoles(e.subject, subject));
    if (entry) {
      return { permissions: [...entry.permissions], at: path };
    }
  }
  return undefined;
}

/**
 * The entry which decides what the subject may do with an object. The own entries of the subject
 * decide first, on the object and then on each parent. Only if they have none on that whole path,
 * the entries of the public decide, with the same walk. The first entry found decides all
 * permissions, entries are never combined, so an entry on the object without Read takes Read away
 * and an own entry on a parent beats an entry of the public on a child.
 *
 * Backend and frontend resolve permissions with this one definition.
 */
export function resolvePermissionEntry(
  entries: readonly PermissionEntry[],
  subject: SubjectRoles,
  object: string,
): ResolvedPermissionEntry | undefined {
  const own = resolveAlongPath(entries, subject, object);
  if (own) {
    return { ...own, from: PermissionEntryOrigin.OWN };
  }
  if (subjectFallsBackToPublic(subject)) {
    const fromPublic = resolveAlongPath(entries, PUBLIC, object);
    if (fromPublic) {
      return { ...fromPublic, from: PermissionEntryOrigin.PUBLIC };
    }
  }
  return undefined;
}
