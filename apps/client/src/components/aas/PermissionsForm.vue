<script setup lang="ts">
import type {
  MemberRoleDtoType,
  PermissionType,
  UserRoleDtoType,
} from "@open-dpp/dto";
import type { IAasPermissionsForm } from "../../composables/aas-permissions-form.ts";
import { Permissions } from "@open-dpp/dto";
import { onMounted, ref } from "vue";

import { useAasRoleHierarchy } from "../../composables/aas-role-hierarchy.ts";

const { getPermissions, editPermissions } = defineProps<Omit<IAasPermissionsForm, "savePermissions">>();

const permissionPerObjects = ref<ReturnType<typeof getPermissions>>([]);

const selectedRole = ref<{
  userRole: UserRoleDtoType;
  memberRole?: MemberRoleDtoType;
} | null>(null);

const selectedPermissions = ref<PermissionType[]>([]);

onMounted(() => {
  permissionPerObjects.value = getPermissions();
  selectedRole.value = permissionPerObjects.value[0]?.subject ?? null;

  selectedPermissions.value
    = permissionPerObjects.value[0]?.permissions.map(p => p.permission) ?? [];
});

const { hierarchy } = useAasRoleHierarchy();

const roles = ref(hierarchy);

const permissionOptions = ref([
  { name: "Read", key: Permissions.Read },
  { name: "Create", key: Permissions.Create },
  { name: "Edit", key: Permissions.Edit },
  { name: "Delete", key: Permissions.Delete },
]);

function onRoleChange(role: {
  userRole: UserRoleDtoType;
  memberRole?: MemberRoleDtoType;
}) {
  const foundPermissionPerObject = permissionPerObjects.value.find(
    p => JSON.stringify(p.subject) === JSON.stringify(role),
  );
  if (foundPermissionPerObject) {
    selectedPermissions.value = foundPermissionPerObject.permissions.map(
      p => p.permission,
    );
  }
  else {
    selectedPermissions.value = [];
  }
}
function onPermissionChange() {
  if (selectedRole.value) {
    editPermissions(selectedPermissions.value, selectedRole.value);
  }
}
</script>

<template>
  <div>
    <div>Permissions</div>
    <Select
      v-model="selectedRole"
      :options="roles"
      option-value="key"
      option-label="name"
      placeholder="Select a role"
      class="w-full md:w-56"
      @update:model-value="onRoleChange"
    />
    <div
      v-for="permission in permissionOptions"
      :key="permission.key"
      class="flex items-center gap-2"
    >
      <Checkbox
        v-model="selectedPermissions"
        :input-id="permission.key"
        name="permissions"
        :value="permission.name"
        @update:model-value="onPermissionChange"
      />
      <label :for="permission.key">{{ permission.name }}</label>
    </div>
  </div>
</template>
