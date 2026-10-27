<script setup lang="ts">
import type {
  AccessPermissionRuleResponseDto,
  AssetAdministrationShellModificationDto,
  DeletePolicyDto,
  PermissionType,
} from "@open-dpp/dto";
import type { AasEditorPath } from "../../composables/aas-drawer.ts";

import type { PermissionsPerSubject } from "../../composables/aas-permissions-form.ts";

import type { Subject } from "../../lib/aas-security.ts";
import { Permissions } from "@open-dpp/dto";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAasPermissionOptions } from "../../composables/aas-permission-options.ts";
import { useAasPermissionsForm } from "../../composables/aas-permissions-form.ts";
import { useRoleHierarchy } from "../../composables/role-hierarchy.ts";
import { isEqualSubject } from "../../lib/aas-security.ts";
import { useUserStore } from "../../stores/user.ts";

const props = defineProps<{
  ignoredPermissionOptions?: PermissionType[];
  disabled?: boolean;
  path: AasEditorPath;
  getAccessPermissionRules: () => AccessPermissionRuleResponseDto[];
  modifyShell: (data: AssetAdministrationShellModificationDto) => Promise<void>;
  deletePolicyBySubjectAndObject: (data: DeletePolicyDto) => Promise<void>;
  hideInheritanceToggle?: boolean;
}>();

const {
  permissions,
  editPermissions,
  savePermissions,
  resetToInheritedPermissions,
  takeOverInheritedPermissions,
} = useAasPermissionsForm({
  getAccessPermissionRules: props.getAccessPermissionRules,
  object: props.path.idShortPathIncludingSubmodel ?? "",
  modifyShell: props.modifyShell,
  deletePolicyBySubjectAndObject: props.deletePolicyBySubjectAndObject,
  ignoredPermissionOptions: props.ignoredPermissionOptions,
});

const { asSubject } = useUserStore();
const { getVisibleRoles, canEditPermissionsOfRole, getRoleDescription } = useRoleHierarchy();

const roles = ref(getVisibleRoles(asSubject()));
const selectedRole = ref<Subject>(asSubject());

const permissionsOfSelectedRole = computed<PermissionsPerSubject>(
  () =>
    permissions.value.find((p) => isEqualSubject(p.subject, selectedRole.value)) ?? {
      subject: selectedRole.value,
      permissions: [],
      inheritsPermissionsOf: null,
    },
);

const canEditPermissions = computed(() => {
  if (!selectedRole.value) {
    return false;
  }
  return canEditPermissionsOfRole(asSubject(), selectedRole.value);
});

const { t } = useI18n();

const { getPermissionOptions } = useAasPermissionOptions(props.ignoredPermissionOptions);
const permissionOptions = computed(() => getPermissionOptions(selectedRole.value));
const roleDescription = computed(() => getRoleDescription(selectedRole.value));

function onPermissionChange(newPermissions: PermissionType[]) {
  editPermissions(newPermissions, selectedRole.value);
}

async function savePermissionsAndClose() {
  await savePermissions();
}

async function onToggleInheritance(shouldOverride: boolean) {
  if (shouldOverride) {
    takeOverInheritedPermissions(selectedRole.value);
  } else {
    await resetToInheritedPermissions(selectedRole.value);
  }
}

const permissionsInherited = computed(
  () => permissionsOfSelectedRole.value.inheritsPermissionsOf !== null,
);

function isReadDisabledCauseOfOtherPermissionsAreActive(key: PermissionType) {
  return (
    key === Permissions.Read &&
    permissionsOfSelectedRole.value.permissions.some((p) => p !== Permissions.Read)
  );
}

defineExpose<{
  savePermissions: () => Promise<void>;
}>({
  savePermissions: savePermissionsAndClose,
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <h3 class="text-xl font-bold">{{ t("aasEditor.security.permissions") }}</h3>
    <div class="flex flex-row gap-2">
      <Select
        v-model="selectedRole"
        :options="roles"
        option-value="key"
        option-label="name"
        placeholder="Select a role"
        class="w-full md:w-56"
        :disabled="disabled"
      />
    </div>
    <p v-if="roleDescription" class="text-sm text-gray-600" data-cy="role-description">
      {{ roleDescription }}
    </p>
    <div class="flex flex-col gap-3 p-2">
      <div v-if="!props.hideInheritanceToggle" class="flex items-center gap-2">
        <ToggleSwitch
          input-id="toggle-inheritance"
          :model-value="!permissionsInherited"
          :disabled="disabled || !canEditPermissions"
          @update:model-value="onToggleInheritance"
        />
        <label for="toggle-inheritance">{{
          `${permissionsInherited ? t("aasEditor.security.inheritedPermission") : t("aasEditor.security.overriddenPermission")}`
        }}</label>
      </div>
      <div
        v-for="permission in permissionOptions"
        :key="permission.key"
        class="flex items-center gap-2"
      >
        <Checkbox
          :model-value="permissionsOfSelectedRole.permissions"
          :input-id="permission.key"
          :disabled="
            disabled ||
            !canEditPermissions ||
            permissionsInherited ||
            isReadDisabledCauseOfOtherPermissionsAreActive(permission.key)
          "
          name="permissions"
          :value="permission.key"
          @update:model-value="onPermissionChange"
        />
        <label :for="permission.key">{{ `${permission.name}` }}</label>
      </div>
    </div>
  </div>
</template>
