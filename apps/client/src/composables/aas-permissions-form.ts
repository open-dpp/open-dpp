import type {
  AccessPermissionRuleResponseDto,
  AssetAdministrationShellModificationDto,
  DeletePolicyDto,
  PermissionType,
} from "@open-dpp/dto";
import type { Ref } from "vue";
import type { PermissionSource } from "../lib/aas-permission-resolution.ts";
import type { Subject } from "../lib/aas-security.ts";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { ref, toRaw } from "vue";
import { resolvePermissions } from "../lib/aas-permission-resolution.ts";
import {
  isEqualSubject,
  makeRule,
  makeSubjectAttributes,
  ruleHelper,
} from "../lib/aas-security.ts";
import { useUserStore } from "../stores/user.ts";
import { useRoleHierarchy } from "./role-hierarchy.ts";

export interface PermissionsPerSubject {
  subject: Subject;
  permissions: PermissionType[];
  /** Where the permissions come from if the subject has no rule of its own on the object. */
  inheritedFrom: PermissionSource | null;
}

export interface IAasPermissionsForm {
  permissions: Ref<PermissionsPerSubject[]>;
  editPermissions: (permissions: PermissionType[], subject: Subject) => void;
  savePermissions: () => Promise<void>;
  resetToInheritedPermissions: (subject: Subject) => Promise<void>;
  takeOverInheritedPermissions: (subject: Subject) => void;
}

export interface AasPermissionsFormProps {
  object: string;
  getAccessPermissionRules: () => AccessPermissionRuleResponseDto[];
  modifyShell: (data: AssetAdministrationShellModificationDto) => Promise<void>;
  deletePolicyBySubjectAndObject: (data: DeletePolicyDto) => Promise<void>;
  ignoredPermissionOptions?: PermissionType[];
}

export function useAasPermissionsForm({
  getAccessPermissionRules,
  object,
  modifyShell,
  deletePolicyBySubjectAndObject,
  ignoredPermissionOptions,
}: AasPermissionsFormProps): IAasPermissionsForm {
  const { canEditPermissionsOfRole, hierarchy } = useRoleHierarchy();
  const { asSubject } = useUserStore();

  const accessPermissionRulesOfObjectWhichAreNotInherited = ref<AccessPermissionRuleResponseDto[]>(
    filterRulesForObject(object),
  );

  const permissions = ref<PermissionsPerSubject[]>(getPermissionsForAllSubjects());

  function filterRulesForObject(object: string) {
    const clonedRules = structuredClone(toRaw(getAccessPermissionRules()));
    const foundRules: AccessPermissionRuleResponseDto[] = [];
    for (const rule of clonedRules) {
      const foundPermissionsForObject = rule.permissionsPerObject.filter(
        (p) => p.object.idShort === object,
      );
      if (foundPermissionsForObject.length > 0) {
        foundRules.push({ ...rule, permissionsPerObject: foundPermissionsForObject });
      }
    }
    return foundRules;
  }

  async function resetToInheritedPermissions(subject: Subject) {
    await deletePolicyBySubjectAndObject({ subject: makeSubjectAttributes(subject), object });
    accessPermissionRulesOfObjectWhichAreNotInherited.value =
      accessPermissionRulesOfObjectWhichAreNotInherited.value.filter(
        (r) => !ruleHelper(r).hasEqualSubject(subject),
      );
    updatePermissions();
  }

  function takeOverInheritedPermissions(subject: Subject) {
    const newPermissions =
      permissions.value.find((p) => isEqualSubject(p.subject, subject))?.permissions || [];
    editPermissions(newPermissions, subject);
  }

  function editPermissions(newPermissions: PermissionType[], subject: Subject) {
    const foundRule = accessPermissionRulesOfObjectWhichAreNotInherited.value.find((r) =>
      ruleHelper(r).hasEqualSubject(subject),
    );
    const allowedPermissions = newPermissions.map((p) => ({
      permission: p,
      kindOfPermission: PermissionKind.Allow,
    }));

    // Create / Edit / Delete do not make sense without Read permission
    if (
      !newPermissions.includes(Permissions.Read) &&
      newPermissions.some(
        (p) =>
          p !== Permissions.Read &&
          !(ignoredPermissionOptions && ignoredPermissionOptions.includes(p)),
      )
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
    } else {
      accessPermissionRulesOfObjectWhichAreNotInherited.value.push(
        makeRule({ subject, object, permissions: allowedPermissions }),
      );
    }
    updatePermissions();
  }

  function updatePermissions() {
    permissions.value = getPermissionsForAllSubjects();
  }

  async function savePermissions() {
    if (accessPermissionRulesOfObjectWhichAreNotInherited.value.length > 0) {
      const rulesAllowedToModify = accessPermissionRulesOfObjectWhichAreNotInherited.value.filter(
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
    const allPermissions: {
      subject: Subject;
      permissions: PermissionType[];
      inheritedFrom: PermissionSource | null;
    }[] = [];
    const allSubjects = hierarchy.map((role) => role.key);
    for (const subject of allSubjects) {
      const { permissions, inheritedFrom } = getPermissionsForSubject(subject);
      let filteredPermissions = permissions;
      if (ignoredPermissionOptions) {
        filteredPermissions = permissions.filter((p) => !ignoredPermissionOptions.includes(p));
      }

      allPermissions.push({ subject, permissions: filteredPermissions, inheritedFrom });
    }
    return allPermissions;
  }

  // The rules on the object as edited so far, and the rules of all other objects as loaded
  function currentRules(): AccessPermissionRuleResponseDto[] {
    const rulesOfOtherObjects = structuredClone(toRaw(getAccessPermissionRules()))
      .map((rule) => ({
        ...rule,
        permissionsPerObject: rule.permissionsPerObject.filter((p) => p.object.idShort !== object),
      }))
      .filter((rule) => rule.permissionsPerObject.length > 0);
    return [...accessPermissionRulesOfObjectWhichAreNotInherited.value, ...rulesOfOtherObjects];
  }

  function getPermissionsForSubject(subject: Subject) {
    return resolvePermissions({ rules: currentRules(), subject, object });
  }

  return {
    permissions,
    editPermissions,
    savePermissions,
    resetToInheritedPermissions,
    takeOverInheritedPermissions,
  };
}
