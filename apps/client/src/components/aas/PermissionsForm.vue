<script setup lang="ts">
import type { PermissionType } from "@open-dpp/dto";
import type { IAasPermissionsForm } from "../../composables/aas-permissions-form.ts";
import type { Subject } from "../../lib/aas-security.ts";
import { Permissions, UserRoleDto } from "@open-dpp/dto";

import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoleHierarchy } from "../../composables/role-hierarchy.ts";
import { useUserStore } from "../../stores/user.ts";

const {
  getPermissions,
  editPermissions,
  resetPermissions,
  ignoredPermissionOptions,
  disabled,
} = defineProps<
  Omit<IAasPermissionsForm, "savePermissions"> & {
    ignoredPermissionOptions?: PermissionType[];
    disabled?: boolean;
  }
>();

const { asSubject } = useUserStore();
const { getVisibleRoles, canEditPermissionsOfRole } = useRoleHierarchy();

const roles = ref(getVisibleRoles(asSubject()));
const selectedRole = ref<Subject>(asSubject());

const permissions = computed<ReturnType<typeof getPermissions>>(() =>
  getPermissions(selectedRole.value),
);

const canEditPermissions = computed(() => {
  if (!selectedRole.value) {
    return false;
  }
  return canEditPermissionsOfRole(asSubject(), selectedRole.value);
});

const { t } = useI18n();

const permissionOptions = computed(() => {
  let options: { name: string; key: PermissionType }[] = [{ name: t("aasEditor.security.read"), key: Permissions.Read }];

  if (selectedRole.value.userRole !== UserRoleDto.ANONYMOUS) {
    options.push(
      { name: t("aasEditor.security.create"), key: Permissions.Create },
      { name: t("aasEditor.security.edit"), key: Permissions.Edit },
      { name: t("aasEditor.security.delete"), key: Permissions.Delete },
    );
  }
  if (ignoredPermissionOptions) {
    options = options.filter(
      permission => !ignoredPermissionOptions.includes(permission.key),
    );
  }

  return options;
});

const disableResetButton = ref<boolean>(true);

function onPermissionChange(newPermissions: PermissionType[]) {
  editPermissions(newPermissions, selectedRole.value);
  disableResetButton.value = false;
}

function onResetPermissions() {
  resetPermissions(selectedRole.value);
  disableResetButton.value = true;
}
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
      <Button
        :disabled="disabled || !canEditPermissions || disableResetButton"
        :label="t('common.reset')"
        @click="onResetPermissions"
      />
    </div>
    <div class="p-2">
      <div
        v-for="permission in permissionOptions"
        :key="permission.key"
        class="flex items-center gap-2"
      >
        <Checkbox
          :model-value="permissions.permissions"
          :input-id="permission.key"
          :disabled="disabled || !canEditPermissions || (permission.key === Permissions.Read && permissions.permissions.some(p => p !== Permissions.Read))"
          name="permissions"
          :value="permission.key"
          @update:model-value="onPermissionChange"
        />
        <label :for="permission.key">{{
          `${permission.name}${permissions.inheritsPermissionsOf !== null ? ` (${t("aasEditor.security.inheritedPermission")})` : ""}`
        }}</label>
      </div>
    </div>
  </div>
</template>
