import type { AccessPermissionRuleResponseDto, AssetAdministrationShellModificationDto, MemberRoleDtoType, PermissionType, UserRoleDtoType } from "@open-dpp/dto";
import {
  PermissionKind,

} from "@open-dpp/dto";
import { ref, toRaw } from "vue";
import { makeRule, ruleHelper } from "../lib/aas-security.ts";
import { useUserStore } from "../stores/user.ts";
import { useRoleHierarchy } from "./role-hierarchy.ts";

interface Subject {
  userRole: UserRoleDtoType;
  memberRole?: MemberRoleDtoType;
}

export interface IAasPermissionsForm {
  getPermissions: (subject: Subject) => {
    permissions: PermissionType[];
    inheritsPermissionsOf: string | null;
  };
  editPermissions: (permissions: PermissionType[], subject: Subject) => void;
  savePermissions: () => Promise<void>;
  resetPermissions: (subject: Subject) => void;
}

export interface AasPermissionsFormProps {
  object: string;
  allAccessPermissionRules: AccessPermissionRuleResponseDto[];
  modifyShell: (data: AssetAdministrationShellModificationDto) => Promise<void>;
}

export function useAasPermissionsForm({
  allAccessPermissionRules,
  object,
  modifyShell,
}: AasPermissionsFormProps): IAasPermissionsForm {
  const { canEditPermissionsOfRole } = useRoleHierarchy();
  const { asSubject } = useUserStore();

  const accessPermissionRulesOfObject = ref<AccessPermissionRuleResponseDto[]>(
    filterRulesForObject(allAccessPermissionRules, object),
  );

  function filterRulesForObject(rules: AccessPermissionRuleResponseDto[], object: string) {
    const clonedRules = structuredClone(toRaw(allAccessPermissionRules));
    const foundRules: AccessPermissionRuleResponseDto[] = [];
    for (const rule of clonedRules) {
      const foundPermissionsForObject = rule.permissionsPerObject.filter(p => p.object.idShort === object);
      if (foundPermissionsForObject.length > 0) {
        foundRules.push({ ...rule, permissionsPerObject: foundPermissionsForObject });
      }
    }
    return foundRules;
  }

  function resetPermissions(subject: Subject) {
    const { permissions, inheritsPermissionsOf } = getPermissions(
      subject,
      object,
      filterRulesForObject(allAccessPermissionRules, object),
    );
    if (inheritsPermissionsOf) {
      accessPermissionRulesOfObject.value
        = accessPermissionRulesOfObject.value.filter(
          r => !ruleHelper(r).hasEqualSubject(subject),
        );
    }
    else {
      editPermissions(permissions, subject);
    }
  }

  function editPermissions(
    permissions: PermissionType[],
    subject: Subject,
  ) {
    const foundRule = accessPermissionRulesOfObject.value.find(r =>
      ruleHelper(r).hasEqualSubject(subject),
    );
    const allowedPermissions = permissions.map(p => ({ permission: p, kindOfPermission: PermissionKind.Allow }));
    if (foundRule) {
      for (const permissionPerObject of foundRule.permissionsPerObject) {
        permissionPerObject.permissions = allowedPermissions;
      }
    }
    else {
      accessPermissionRulesOfObject.value.push(makeRule({ subject, object, permissions: allowedPermissions }));
    }
  }

  async function savePermissions() {
    if (accessPermissionRulesOfObject.value.length > 0) {
      const rulesAllowedToModify = accessPermissionRulesOfObject.value.filter((r) => {
        const subject = asSubject();
        return canEditPermissionsOfRole(subject, ruleHelper(r).getSubject());
      });

      await modifyShell({
        security: {
          localAccessControl: {
            accessPermissionRules: rulesAllowedToModify,
          },
        },
      });
    }
  }

  function getPermissions(
    subject: Subject,
    consideredObject: string = object,
    accessPermissionRules?: AccessPermissionRuleResponseDto[],
  ): { permissions: PermissionType[]; inheritsPermissionsOf: string | null } {
    const rules = accessPermissionRules
      ? filterRulesForObject(accessPermissionRules, consideredObject)
      : accessPermissionRulesOfObject.value;
    const inheritsPermissionsOf = consideredObject === object ? null : consideredObject;

    for (const rule of rules) {
      for (const permissionPerObject of rule.permissionsPerObject) {
        if (ruleHelper(rule).hasEqualSubject(subject)) {
          return { permissions: permissionPerObject.permissions.map(p => p.permission), inheritsPermissionsOf };
        }
      }
    }
    const parentPath = consideredObject.split(".").slice(0, -1);

    if (parentPath.length > 0) {
      return getPermissions(subject, parentPath.join("."), allAccessPermissionRules);
    }

    return { permissions: [], inheritsPermissionsOf: null };
  }

  return { editPermissions, getPermissions, savePermissions, resetPermissions };
}
