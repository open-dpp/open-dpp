import type {
  AccessPermissionRuleResponseDto,
  PermissionType,
} from "@open-dpp/dto";
import { PermissionKind } from "@open-dpp/dto";
import { ruleHelper } from "../lib/aas-security.ts";
import { useUserStore } from "../stores/user.ts";

export interface IAasAbility {
  can: (action: PermissionType, object: string) => boolean;
}

export interface AasAbilityProps {
  getAccessPermissionRules: () => AccessPermissionRuleResponseDto[];
}

export function useAasAbility({
  getAccessPermissionRules,
}: AasAbilityProps): IAasAbility {
  const { asSubject } = useUserStore();

  function findPermissionForObject(
    object: string,
  ) {
    const rulesOfSubject = getAccessPermissionRules().filter(r => ruleHelper(r).hasEqualSubject(asSubject()));
    for (const rule of rulesOfSubject) {
      for (const permissionPerObject of rule.permissionsPerObject) {
        if (permissionPerObject.object.idShort === object.toString()) {
          return permissionPerObject;
        }
      }
    }
  }

  function can(action: PermissionType, object: string): boolean {
    const permissionForObject = findPermissionForObject(object);
    if (permissionForObject) {
      return permissionForObject.permissions.some(p => p.permission === action && p.kindOfPermission === PermissionKind.Allow);
    }

    const parentPath = object.split(".").slice(0, -1);

    if (parentPath.length > 0) {
      return can(action, parentPath.join("."));
    }

    return false;
  }

  return { can };
}
