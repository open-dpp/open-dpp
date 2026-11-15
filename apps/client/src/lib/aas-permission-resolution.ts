import type { AccessPermissionRuleResponseDto, PermissionType } from "@open-dpp/dto";
import type { PermissionEntry } from "@open-dpp/permission";
import type { Subject } from "./aas-security.ts";
import {
  PermissionEntryOrigin,
  resolvePermissionEntry,
  subjectFallsBackToPublic,
} from "@open-dpp/permission";
import { ruleHelper } from "./aas-security.ts";

/** Where the permissions of a subject on an object come from, if not from a rule on the object. */
export type PermissionSource = { kind: "parent"; object: string } | { kind: "public" };

export interface ResolvedPermissions {
  permissions: PermissionType[];
  /** `null`: the subject has its own rule on the object, or no rule applies at all. */
  inheritedFrom: PermissionSource | null;
}

/**
 * Whether the permissions of the subject can be inherited at all: from the parent node of the
 * object, if it has one, or from the public, which admins, owners, members and guests fall back to.
 */
export function canInheritPermissions(subject: Subject, objectHasParent: boolean): boolean {
  return objectHasParent || subjectFallsBackToPublic(subject);
}

function entriesOf(rules: AccessPermissionRuleResponseDto[]): PermissionEntry[] {
  return rules.flatMap((rule) => {
    const subject = ruleHelper(rule).getSubject();
    return rule.permissionsPerObject.map((permissionPerObject) => ({
      subject,
      object: permissionPerObject.object.idShort,
      permissions: permissionPerObject.permissions.map((p) => p.permission),
    }));
  });
}

/**
 * The permissions a subject has on an object, resolved like the backend does, with the definition
 * of `@open-dpp/permission`, and where they come from.
 */
export function resolvePermissions(data: {
  rules: AccessPermissionRuleResponseDto[];
  subject: Subject;
  object: string;
}): ResolvedPermissions {
  const resolved = resolvePermissionEntry(entriesOf(data.rules), data.subject, data.object);
  if (!resolved) {
    return { permissions: [], inheritedFrom: null };
  }
  if (resolved.from === PermissionEntryOrigin.PUBLIC) {
    return { permissions: resolved.permissions, inheritedFrom: { kind: "public" } };
  }
  return {
    permissions: resolved.permissions,
    inheritedFrom: resolved.at === data.object ? null : { kind: "parent", object: resolved.at },
  };
}
