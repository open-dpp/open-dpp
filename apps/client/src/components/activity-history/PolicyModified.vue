<script setup lang="ts">
import { type MemberRoleDtoType, type PermissionDto, type UserRoleDtoType } from "@open-dpp/dto";
import { useRoleHierarchy } from "../../composables/role-hierarchy.ts";
import { usePermissions } from "../../composables/permissions.ts";
import PermissionList from "./PermissionList.vue";
import RoleHeader from "./RoleHeader.vue";

const props = defineProps<{
  userRole: UserRoleDtoType;
  memberRole: MemberRoleDtoType | null;
  oldValue: PermissionDto[];
  newValue: PermissionDto[];
}>();
</script>

<template>
  <RoleHeader :user-role="props.userRole" :member-role="props.memberRole" />
  <DiffViewer>
    <template #oldValue>
      <PermissionList :permissions="props.oldValue" />
    </template>
    <template #newValue> <PermissionList :permissions="props.newValue" /></template>
  </DiffViewer>
</template>

<style scoped></style>
