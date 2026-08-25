<script setup lang="ts">
import { type MemberRoleDtoType, type PermissionDto, type UserRoleDtoType } from "@open-dpp/dto";
import { useRoleHierarchy } from "../../composables/role-hierarchy.ts";
import PermissionList from "./PermissionList.vue";
import RoleHeader from "./RoleHeader.vue";

const props = defineProps<{
  path: string;
  userRole: UserRoleDtoType;
  memberRole: MemberRoleDtoType | null;
  value: PermissionDto[];
}>();
</script>

<template>
  <IdShortPath :path="props.path" />
  <RoleHeader :user-role="props.userRole" :member-role="props.memberRole" />
  <PermissionList :permissions="props.value" />
</template>

<style scoped></style>
