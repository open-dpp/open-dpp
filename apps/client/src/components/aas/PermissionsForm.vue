<script setup lang="ts">
import type { PermissionType } from "@open-dpp/dto";
import type { IAasPermissionsForm } from "../../composables/aas-permissions-form.ts";
import type { Subject } from "../../lib/aas-security.ts";
import { Permissions } from "@open-dpp/dto";

import { computed, ref } from "vue";
import { useRoleHierarchy } from "../../composables/role-hierarchy.ts";
import { useUserStore } from "../../stores/user.ts";

const { getPermissions, editPermissions, resetPermissions }
  = defineProps<Omit<IAasPermissionsForm, "savePermissions">>();

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

const permissionOptions = ref([
  { name: "Read", key: Permissions.Read },
  { name: "Create", key: Permissions.Create },
  { name: "Edit", key: Permissions.Edit },
  { name: "Delete", key: Permissions.Delete },
]);

function onPermissionChange(newPermissions: PermissionType[]) {
  editPermissions(newPermissions, selectedRole.value);
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-xl font-bold">Permissions</span>
    <div class="flex flex-row gap-2">
      <Select
        v-model="selectedRole"
        :options="roles"
        option-value="key"
        option-label="name"
        placeholder="Select a role"
        class="w-full md:w-56"
      />
      <Button
        :disabled="!canEditPermissions"
        label="Reset"
        @click="resetPermissions(selectedRole)"
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
          :disabled="!canEditPermissions"
          name="permissions"
          :value="permission.name"
          @update:model-value="onPermissionChange"
        />
        <label :for="permission.key">{{ permission.name }}</label>
      </div>
    </div>
  </div>
</template>
