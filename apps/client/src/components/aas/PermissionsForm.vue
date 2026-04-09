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
import { Permissions, UserRoleDto } from "@open-dpp/dto";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
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
});

const { asSubject } = useUserStore();
const { getVisibleRoles, canEditPermissionsOfRole } = useRoleHierarchy();

const roles = ref(getVisibleRoles(asSubject()));
const selectedRole = ref<Subject>(asSubject());

const permissionsOfSelectedRole = computed<PermissionsPerSubject>(
  () =>
    permissions.value.find(p =>
      isEqualSubject(p.subject, selectedRole.value),
    ) ?? {
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

const permissionOptions = computed(() => {
  let options: { name: string; key: PermissionType }[] = [
    { name: t("aasEditor.security.read"), key: Permissions.Read },
  ];

  if (selectedRole.value.userRole !== UserRoleDto.ANONYMOUS) {
    options.push(
      { name: t("aasEditor.security.create"), key: Permissions.Create },
      { name: t("aasEditor.security.edit"), key: Permissions.Edit },
      { name: t("aasEditor.security.delete"), key: Permissions.Delete },
    );
  }
  if (props.ignoredPermissionOptions !== undefined) {
    options = options.filter(
      permission =>
        props.ignoredPermissionOptions
        && !props.ignoredPermissionOptions.includes(permission.key),
    );
  }

  return options;
});

function onPermissionChange(newPermissions: PermissionType[]) {
  editPermissions(newPermissions, selectedRole.value);
}

async function savePermissionsAndClose() {
  await savePermissions();
}

async function onToggleInheritance(shouldInherit: boolean) {
  if (shouldInherit) {
    await resetToInheritedPermissions(selectedRole.value);
  }
  else {
    takeOverInheritedPermissions(selectedRole.value);
  }
}

const permissionsInherited = computed(
  () => permissionsOfSelectedRole.value.inheritsPermissionsOf !== null,
);

defineExpose<{
  savePermissions: () => Promise<void>;
}>({
  savePermissions: savePermissionsAndClose,
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-xl font-bold">{{
      t("aasEditor.security.permissions")
    }}</span>
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
    <div class="flex flex-col p-2 gap-3">
      <div class="flex items-center gap-2">
        <ToggleSwitch
          input-id="toggle-inheritance"
          :model-value="permissionsInherited"
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
            disabled
              || !canEditPermissions
              || permissionsInherited
              || (permission.key === Permissions.Read
                && permissionsOfSelectedRole.permissions.some(
                  (p) => p !== Permissions.Read,
                ))
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
