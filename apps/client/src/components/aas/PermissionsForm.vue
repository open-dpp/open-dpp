<script setup lang="ts">
import type {
  MemberRoleDtoType,
  PermissionType,
  UserRoleDtoType,
} from "@open-dpp/dto";
import type { IAasPermissionsForm } from "../../composables/aas-permissions-form.ts";
import type { Subject } from "../../lib/aas-security.ts";
import { Permissions } from "@open-dpp/dto";

import { computed, onMounted, ref } from "vue";
import { useRoleHierarchy } from "../../composables/role-hierarchy.ts";
import { useUserStore } from "../../stores/user.ts";

const { getPermissions, editPermissions }
  = defineProps<Omit<IAasPermissionsForm, "savePermissions">>();

const permissionPerObjects = ref<ReturnType<typeof getPermissions>>([]);

const { asSubject } = useUserStore();
const { getVisibleRoles, canEditPermissionsOfRole } = useRoleHierarchy();

const roles = ref(getVisibleRoles(asSubject()));
const selectedRole = ref<Subject>(asSubject());

const selectedPermissions = ref<PermissionType[]>([]);

onMounted(() => {
  permissionPerObjects.value = getPermissions();

  if (selectedRole.value) {
    setPermissions(selectedRole.value);
  }
});

function setPermissions(subject: Subject) {
  const foundPermissionPerObject = permissionPerObjects.value.find(
    p => JSON.stringify(p.subject) === JSON.stringify(subject),
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

const canEditPermissions = computed(() => {
  if (!selectedRole.value) {
    return false;
  }
  return canEditPermissionsOfRole(
    asSubject(),
    selectedRole.value,
  );
});

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
  setPermissions(role);
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
        :disabled="!canEditPermissions"
        name="permissions"
        :value="permission.name"
        @update:model-value="onPermissionChange"
      />
      <label :for="permission.key">{{ permission.name }}</label>
    </div>
  </div>
</template>
