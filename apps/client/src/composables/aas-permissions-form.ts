import type { AccessPermissionRuleResponseDto, AssetAdministrationShellModificationDto, MemberRoleDtoType, PermissionDto, PermissionType, UserRoleDtoType } from "@open-dpp/dto";
import {
  PermissionKind,

} from "@open-dpp/dto";
import { ref } from "vue";
import { makeRule } from "../lib/aas-security.ts";

interface Subject {
  userRole: UserRoleDtoType;
  memberRole?: MemberRoleDtoType;
}

export interface IAasPermissionsForm {
  getPermissions: () => {
    subject: { userRole: UserRoleDtoType; memberRole?: MemberRoleDtoType };
    permissions: PermissionDto[];
  }[];
  editPermissions: (permissions: PermissionType[], subject: Subject) => void;
  savePermissions: () => Promise<void>;
}

export interface AasPermissionsFormProps {
  object: string;
  initialAccessPermissionRules: AccessPermissionRuleResponseDto[];
  modifyShell: (data: AssetAdministrationShellModificationDto) => Promise<void>;
}

export function useAasPermissionsForm({
  initialAccessPermissionRules,
  object,
  modifyShell,
}: AasPermissionsFormProps): IAasPermissionsForm {
  const accessPermissionRules = ref<AccessPermissionRuleResponseDto[]>(
    filterRulesForObject(initialAccessPermissionRules, object),
  );

  function filterRulesForObject(rules: AccessPermissionRuleResponseDto[], object: string) {
    return rules.map(rule => ({
      ...rule,
      permissionsPerObject: rule.permissionsPerObject.filter(p => p.object.idShort === object),
    }));
  }

  function editPermissions(
    permissions: PermissionType[],
    subject: Subject,
  ) {
    const foundRule = accessPermissionRules.value.find(r =>
      makeRule(r).hasEqualSubject(subject),
    );
    if (foundRule) {
      for (const permissionPerObject of foundRule.permissionsPerObject) {
        permissionPerObject.permissions = permissions.map(p => ({
          permission: p,
          kindOfPermission: PermissionKind.Allow,
        }));
      }
    }
  }

  async function savePermissions() {
    await modifyShell({
      security: {
        localAccessControl: {
          accessPermissionRules: accessPermissionRules.value,
        },
      },
    });
  }

  function getPermissions() {
    const permissions: {
      subject: Subject;
      permissions: PermissionDto[];
    }[] = [];
    for (const rule of accessPermissionRules.value) {
      for (const permissionPerObject of rule.permissionsPerObject) {
        const userRole = makeRule(rule).userRole;
        const memberRole = makeRule(rule).memberRole;
        const subject = memberRole ? { userRole, memberRole } : { userRole };
        if (userRole) {
          permissions.push({
            subject,
            permissions: permissionPerObject.permissions,
          });
        }
      }
    }
    return permissions;
  }

  return { editPermissions, getPermissions, savePermissions };
}
