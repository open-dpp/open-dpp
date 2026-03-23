<script setup lang="ts">
import type {
  AccessPermissionRuleResponseDto,
  MemberRoleDtoType,
  PermissionType,
  UserRoleDtoType,
} from "@open-dpp/dto";
import type { AasEditorPath } from "../../composables/aas-drawer.ts";
import { Permissions } from "@open-dpp/dto";
import { ref, watch } from "vue";
import { useAasSecurity } from "../../composables/aas-security.ts";

const props = defineProps<{
  path: AasEditorPath;
  getAccessPermissionRules: () => AccessPermissionRuleResponseDto[];
}>();

const { findPermissionForObject, roleHierarchy, editPermissions }
  = useAasSecurity({
    initialAccessPermissionRules: props.getAccessPermissionRules(),
  });

const permissionPerObjects = ref<ReturnType<typeof findPermissionForObject>>(
  [],
);

const selectedRole = ref<{
  userRole: UserRoleDtoType;
  memberRole?: MemberRoleDtoType;
} | null>(null);

const selectedPermissions = ref<PermissionType[]>([]);

watch(
  () => props.path.idShortPathIncludingSubmodel,
  (newPath) => {
    permissionPerObjects.value = newPath
      ? findPermissionForObject(newPath)
      : [];
    selectedRole.value = permissionPerObjects.value[0]?.subject ?? null;

    selectedPermissions.value
      = permissionPerObjects.value[0]?.permissions.map(p => p.permission) ?? [];
  },
  { immediate: true },
);

const roles = ref(roleHierarchy);

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
  if (props.path.idShortPathIncludingSubmodel && selectedRole.value) {
    editPermissions(
      selectedPermissions.value,
      props.path.idShortPathIncludingSubmodel!,
      selectedRole.value,
    );
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
