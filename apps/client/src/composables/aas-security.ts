import type { AccessPermissionRuleResponseDto, PermissionType, SecurityResponseDto } from "@open-dpp/dto";
import {
  PermissionKind,

} from "@open-dpp/dto";
import { ref } from "vue";

export interface AasSecurityProps {
}

export interface IAasSecurity {
  setAasSecurity: (security: SecurityResponseDto) => void;
}

export function useAasSecurity() {
  const accessPermissionRules = ref<AccessPermissionRuleResponseDto[]>([]);

  function setAasSecurity(security: SecurityResponseDto) {
    accessPermissionRules.value = security.localAccessControl.accessPermissionRules;
  }

  function can(action: PermissionType, object: string): boolean {
    const permissionForObject = findPermissionForObject(object);
    if (permissionForObject) {
      const deny = permissionForObject.permissions.some(p => p.permission === action && p.kindOfPermission === PermissionKind.Deny);
      if (deny) {
        return false;
      }
      else {
        return permissionForObject.permissions.some(p => p.permission === action && p.kindOfPermission === PermissionKind.Allow);
      }
    }

    const parentPath = object.split(".").slice(0, -1);

    if (parentPath.length > 0) {
      return can(action, parentPath.join("."));
    }
    return false;
  }

  function findPermissionForObject(object: string) {
    for (const rule of accessPermissionRules.value) {
      for (const permissionPerObject of rule.permissionsPerObject) {
        if (permissionPerObject.object.idShort === object) {
          return permissionPerObject;
        }
      }
    }
  }

  return { setAasSecurity, can };
}
