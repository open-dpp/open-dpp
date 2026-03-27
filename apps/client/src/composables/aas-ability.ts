import type {
  AccessPermissionRuleResponseDto,
  PermissionType,
} from "@open-dpp/dto";
import { PermissionKind } from "@open-dpp/dto";
import { findPermissionForObject } from "../lib/aas-security.ts";

export interface IAasAbility {
  can: (action: PermissionType, object: string) => boolean;
}

export interface AasAbilityProps {
  accessPermissionRules: AccessPermissionRuleResponseDto[];
}

export function useAasAbility({
  accessPermissionRules,
}: AasAbilityProps): IAasAbility {
  function can(action: PermissionType, object: string): boolean {
    const permissionsPerSubject = findPermissionForObject(
      object,
      accessPermissionRules,
    );
    for (const permissionPerSubject of permissionsPerSubject) {
      const allow = permissionPerSubject.permissions.some(
        p =>
          p.permission === action
          && p.kindOfPermission === PermissionKind.Allow,
      );
      if (allow) {
        return true;
      }
    }

    const parentPath = object.split(".").slice(0, -1);

    if (parentPath.length > 0) {
      return can(action, parentPath.join("."));
    }
    return false;
  }

  return { can };
}
