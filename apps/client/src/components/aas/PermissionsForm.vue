<script setup lang="ts">
import type { MemberRoleDtoType, UserRoleDtoType } from "@open-dpp/dto";
import type { AasEditorPath } from "../../composables/aas-drawer.ts";
import { Permissions } from "@open-dpp/dto";
import { computed, ref } from "vue";
import { useAasSecurity } from "../../stores/aas-security.ts";

const props = defineProps<{
  path: AasEditorPath;
}>();

const { findPermissionForObject, roleHierarchy } = useAasSecurity();
const permissionPerObjects = computed(() => {
  return props.path.idShortPathIncludingSubmodel
    ? findPermissionForObject(props.path.idShortPathIncludingSubmodel)
    : [];
});

const selectedRole = ref<{
  userRole: UserRoleDtoType;
  memberRole?: MemberRoleDtoType;
} | null>(permissionPerObjects.value[0]?.subject ?? null);
const roles = ref(roleHierarchy);

const permissionOptions = ref([
  { name: "Read", key: Permissions.Read },
  { name: "Create", key: Permissions.Create },
  { name: "Edit", key: Permissions.Edit },
  { name: "Delete", key: Permissions.Delete },
]);
const selectedPermissions = ref(
  permissionPerObjects.value[0]
    ? permissionPerObjects.value[0].permissions.map(p => p.permission)
    : [],
);

function onRoleChange(role: {
  userRole: UserRoleDtoType;
  memberRole?: MemberRoleDtoType;
}) {
  const foundPermissionPerObject = permissionPerObjects.value.find(p => JSON.stringify(p.subject) === JSON.stringify(role));
  if (foundPermissionPerObject) {
    selectedPermissions.value = foundPermissionPerObject.permissions.map(p => p.permission);
  }
  else {
    selectedPermissions.value = [];
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
      />
      <label :for="permission.key">{{ permission.name }}</label>
    </div>
  </div>
</template>
