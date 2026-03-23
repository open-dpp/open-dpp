import type { AccessPermissionRuleResponseDto, MemberRoleDtoType, PermissionDto, PermissionType, UserRoleDtoType } from "@open-dpp/dto";
import {

  MemberRoleDto,

  MemberRoleDtoEnum,
  PermissionKind,

  UserRoleDto,
  UserRoleDtoEnum,

} from "@open-dpp/dto";
import { ref } from "vue";

export interface IAasSecurity {
  roleHierarchy: { name: string; key: { userRole: UserRoleDtoType; memberRole?: MemberRoleDtoType } }[];
  can: (action: PermissionType, object: string) => boolean;
  findPermissionForObject: (object: string) => { subject: { userRole: UserRoleDtoType; memberRole?: MemberRoleDtoType }; permissions: PermissionDto[] }[];
}

export interface AasSecurityProps {
  initialAccessPermissionRules: AccessPermissionRuleResponseDto[];
}

export function useAasSecurity({
  initialAccessPermissionRules,
}: AasSecurityProps): IAasSecurity {
  const accessPermissionRules = ref<AccessPermissionRuleResponseDto[]>(
    initialAccessPermissionRules,
  );
  const roleHierarchy = [
    { name: "Admin", key: { userRole: UserRoleDto.ADMIN } }, // instance admin, the organization role is not relevant
    {
      name: "Owner",
      key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER },
    }, // organization owner
    {
      name: "Member",
      key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
    }, // organization member
    { name: "Öffentlich", key: { userRole: UserRoleDto.ANONYMOUS } }, // anonymous user without an account
  ];

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
          const userRole = UserRoleDtoEnum.parse(
            rule.targetSubjectAttributes.subjectAttribute.find(
              p => p.idShort === "userRole",
            )?.value,
          );
          const memberRole = MemberRoleDtoEnum.optional().parse(
            rule.targetSubjectAttributes.subjectAttribute.find(
              p => p.idShort === "memberRole",
            )?.value ?? undefined,
          );
          const subject = memberRole ? { userRole, memberRole } : { userRole };
          if (userRole) {
            permissions.push({
              subject,
              permissions: permissionPerObject.permissions,
            });
          }
        }
      }
    }
    return permissions;
  }

  return { can, findPermissionForObject, roleHierarchy };
};

/*
how to update assetAdministrationShell on security change
pass security to all aas components
transfer useSecurity to a composable
useSecurity(security, onSecurityChange);

 */
