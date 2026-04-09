import type { AccessPermissionRuleResponseDto, AssetAdministrationShellModificationDto, MemberRoleDtoType, PermissionType, UserRoleDtoType } from "@open-dpp/dto";
import type { Ref } from "vue";
import {
  PermissionKind,
  Permissions,
} from "@open-dpp/dto";
import { ref, toRaw } from "vue";
import { makeRule, ruleHelper } from "../lib/aas-security.ts";
import { useUserStore } from "../stores/user.ts";
import { useRoleHierarchy } from "./role-hierarchy.ts";

interface Subject {
  userRole: UserRoleDtoType;
  memberRole?: MemberRoleDtoType;
}

export interface PermissionsPerSubject {
  subject: Subject;
  permissions: PermissionType[];
  inheritsPermissionsOf: string | null;
}

export interface IAasPermissionsForm {
  permissions: Ref<PermissionsPerSubject[]>;
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
  const { canEditPermissionsOfRole, hierarchy } = useRoleHierarchy();
  const { asSubject } = useUserStore();

  const accessPermissionRulesOfObject = ref<AccessPermissionRuleResponseDto[]>(
    filterRulesForObject(allAccessPermissionRules, object),
  );

  const permissions = ref<PermissionsPerSubject[]>(getPermissionsForAllSubjects());

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
    const { permissions, inheritsPermissionsOf } = getPermissionsForSubject(
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
    updatePermissions();
  }

  function editPermissions(
    newPermissions: PermissionType[],
    subject: Subject,
  ) {
    const foundRule = accessPermissionRulesOfObject.value.find(r =>
      ruleHelper(r).hasEqualSubject(subject),
    );
    const allowedPermissions = newPermissions.map(p => ({
      permission: p,
      kindOfPermission: PermissionKind.Allow,
    }));

    // Create / Edit / Delete do not make sense without Read permission
    if (
      !newPermissions.includes(Permissions.Read)
      && newPermissions.some(p => p !== Permissions.Read)
    ) {
      allowedPermissions.push({
        permission: Permissions.Read,
        kindOfPermission: PermissionKind.Allow,
      });
    }

    if (foundRule) {
      for (const permissionPerObject of foundRule.permissionsPerObject) {
        permissionPerObject.permissions = allowedPermissions;
      }
    }
    else {
      accessPermissionRulesOfObject.value.push(
        makeRule({ subject, object, permissions: allowedPermissions }),
      );
    }
    updatePermissions();
  }

  function updatePermissions() {
    permissions.value = getPermissionsForAllSubjects();
  }

  async function savePermissions() {
    if (accessPermissionRulesOfObject.value.length > 0) {
      const rulesAllowedToModify = accessPermissionRulesOfObject.value.filter(
        (r) => {
          const subject = asSubject();
          return canEditPermissionsOfRole(subject, ruleHelper(r).getSubject());
        },
      );

      await modifyShell({
        security: {
          localAccessControl: {
            accessPermissionRules: rulesAllowedToModify,
          },
        },
      });
    }
  }

  function getPermissionsForAllSubjects() {
    const allPermissions: { subject: Subject; permissions: PermissionType[]; inheritsPermissionsOf: string | null }[] = [];
    const allSubjects = hierarchy.map(role => role.key);
    for (const subject of allSubjects) {
      const { permissions, inheritsPermissionsOf } = getPermissionsForSubject(subject);
      allPermissions.push({ subject, permissions, inheritsPermissionsOf });
    }
    return allPermissions;
  }

  function getPermissionsForSubject(
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
      return getPermissionsForSubject(subject, parentPath.join("."), allAccessPermissionRules);
    }

    return { permissions: [], inheritsPermissionsOf: null };
  }

  return { permissions, editPermissions, savePermissions, resetPermissions };
}
