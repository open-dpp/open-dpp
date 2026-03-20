import type { AccessPermissionRuleResponseDto, MemberRoleDtoType, PermissionDto, PermissionType, SecurityResponseDto, UserRoleDtoType } from "@open-dpp/dto";
import {

  MemberRoleDto,

  MemberRoleDtoEnum,
  PermissionKind,

  UserRoleDto,
  UserRoleDtoEnum,

} from "@open-dpp/dto";
import { defineStore } from "pinia";
import { ref } from "vue";

export interface IAasSecurity {
  roleHierarchy: { name: string; key: { userRole: UserRoleDtoType; memberRole?: MemberRoleDtoType } }[];
  setAasSecurity: (security: SecurityResponseDto) => void;
  can: (action: PermissionType, object: string) => boolean;
  findPermissionForObject: (object: string) => { subject: { userRole: UserRoleDtoType; memberRole?: MemberRoleDtoType }; permissions: PermissionDto[] }[];
}

export const useAasSecurity = defineStore("aas-security", () => {
  const accessPermissionRules = ref<AccessPermissionRuleResponseDto[]>([]);
  const roleHierarchy = [
    { name: "Admin", key: { userRole: UserRoleDto.ADMIN } }, // instance admin, the organization role is not relevant
    { name: "Owner", key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER } }, // organization owner
    { name: "Member", key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER } }, // organization member
    { name: "Öffentlich", key: { userRole: UserRoleDto.ANONYMOUS } }, // anonymous user without an account
  ];

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
    const permissions: {
      subject: { userRole: UserRoleDtoType; memberRole?: MemberRoleDtoType };
      permissions: PermissionDto[];
    }[] = [];
    for (const rule of accessPermissionRules.value) {
      for (const permissionPerObject of rule.permissionsPerObject) {
        if (permissionPerObject.object.idShort === object) {
          const userRole = UserRoleDtoEnum.parse(rule.targetSubjectAttributes.subjectAttribute.find(p => p.idShort === "userRole")?.value);
          const memberRole = MemberRoleDtoEnum.optional().parse(rule.targetSubjectAttributes.subjectAttribute.find(p => p.idShort === "memberRole")?.value ?? undefined);
          if (userRole) {
            permissions.push({ subject: { userRole, memberRole }, permissions: permissionPerObject.permissions });
          }
        }
      }
    }
    return permissions;
  }

  return { setAasSecurity, can, findPermissionForObject, roleHierarchy };
});
