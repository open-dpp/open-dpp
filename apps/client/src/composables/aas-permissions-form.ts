import type { AccessPermissionRuleResponseDto, AssetAdministrationShellModificationDto, MemberRoleDtoType, PermissionType, UserRoleDtoType } from "@open-dpp/dto";
import {
  PermissionKind,

} from "@open-dpp/dto";
import { ref } from "vue";
import { makeRule, ruleHelper } from "../lib/aas-security.ts";

interface Subject {
  userRole: UserRoleDtoType;
  memberRole?: MemberRoleDtoType;
}

export interface IAasPermissionsForm {
  getPermissions: (subject: Subject) => PermissionType[];
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
      ruleHelper(r).hasEqualSubject(subject),
    );
    const allowedPermissions = permissions.map(p => ({ permission: p, kindOfPermission: PermissionKind.Allow }));
    if (foundRule) {
      for (const permissionPerObject of foundRule.permissionsPerObject) {
        permissionPerObject.permissions = allowedPermissions;
      }
    }
    else {
      accessPermissionRules.value.push(makeRule({ subject, object, permissions: allowedPermissions }));
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

  function getPermissions(subject: Subject): PermissionType[] {
    const permissions: PermissionType[] = [];
    for (const rule of accessPermissionRules.value) {
      for (const permissionPerObject of rule.permissionsPerObject) {
        if (ruleHelper(rule).hasEqualSubject(subject)) {
          permissions.push(...permissionPerObject.permissions.map(p => p.permission));
        }
      }
    }
    return permissions;
  }

  return { editPermissions, getPermissions, savePermissions };
}
