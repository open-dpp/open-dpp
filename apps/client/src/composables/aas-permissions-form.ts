import type {
  AccessPermissionRuleResponseDto,
  AssetAdministrationShellModificationDto,
  DeletePolicyDto,
  MemberRoleDtoType,
  PermissionType,
  UserRoleDtoType,
} from "@open-dpp/dto";
import type { Ref } from "vue";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { ref, toRaw } from "vue";
import {
  isEqualSubject,
  makeRule,
  makeSubjectAttributes,
  ruleHelper,
} from "../lib/aas-security.ts";
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
      inheritsPermissionsOf: string | null;
    }[] = [];
    const allSubjects = hierarchy.map((role) => role.key);
    for (const subject of allSubjects) {
      const { permissions, inheritsPermissionsOf } = getPermissionsForSubject(subject);
      let filteredPermissions = permissions;
      if (ignoredPermissionOptions) {
        filteredPermissions = permissions.filter((p) => !ignoredPermissionOptions.includes(p));
      }

      allPermissions.push({ subject, permissions: filteredPermissions, inheritsPermissionsOf });
    }
    return allPermissions;
  }

  function getPermissionsForSubject(
    subject: Subject,
    consideredObject: string = object,
  ): { permissions: PermissionType[]; inheritsPermissionsOf: string | null } {
    const inheritsPermissionsOf = consideredObject === object ? null : consideredObject;

    const rules =
      inheritsPermissionsOf !== null
        ? filterRulesForObject(consideredObject)
        : accessPermissionRulesOfObjectWhichAreNotInherited.value;

    for (const rule of rules) {
      for (const permissionPerObject of rule.permissionsPerObject) {
        if (ruleHelper(rule).hasEqualSubject(subject)) {
          return {
            permissions: permissionPerObject.permissions.map((p) => p.permission),
            inheritsPermissionsOf,
          };
        }
      }
    }
    const parentPath = consideredObject.split(".").slice(0, -1);

    if (parentPath.length > 0) {
      return getPermissionsForSubject(subject, parentPath.join("."));
    }

    return { permissions: [], inheritsPermissionsOf: null };
  }

  return {
    permissions,
    editPermissions,
    savePermissions,
    resetToInheritedPermissions,
    takeOverInheritedPermissions,
  };
}
