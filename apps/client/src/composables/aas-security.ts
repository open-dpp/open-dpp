import type {
  AccessPermissionRuleResponseDto,
  PermissionDto,
  PermissionType,
  SecurityResponseDto,
} from "@open-dpp/dto";
import {
  PermissionKind,

} from "@open-dpp/dto";
import { ref } from "vue";

export interface IAasSecurity {
  setAasSecurity: (security: SecurityResponseDto) => void;
  can: (action: PermissionType, object: string) => boolean;
  findPermissionForObject: (object: string) => { subject: { userRole: string; memberRole?: string }; permissions: PermissionDto[] }[];
}

export function useAasSecurity() {
  const accessPermissionRules = ref<AccessPermissionRuleResponseDto[]>([]);

  function setAasSecurity(security: SecurityResponseDto) {
    accessPermissionRules.value = security.localAccessControl.accessPermissionRules;
  }

  function can(action: PermissionType, object: string): boolean {
    const permissionsPerSubject = findPermissionForObject(object);
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

  function findPermissionForObject(object: string) {
    const permissions: { subject: { userRole: string; memberRole?: string }; permissions: PermissionDto[] }[] = [];
    for (const rule of accessPermissionRules.value) {
      for (const permissionPerObject of rule.permissionsPerObject) {
        if (permissionPerObject.object.idShort === object) {
          const userRole = rule.targetSubjectAttributes.subjectAttribute.find(p => p.idShort === "userRole")?.value;
          const memberRole = rule.targetSubjectAttributes.subjectAttribute.find(p => p.idShort === "memberRole")?.value ?? undefined;
          if (userRole) {
            permissions.push({ subject: { userRole, memberRole }, permissions: permissionPerObject.permissions });
          }
        }
      }
    }
    return permissions;
  }

  return { setAasSecurity, can, findPermissionForObject };
}
