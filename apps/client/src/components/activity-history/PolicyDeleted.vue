<script setup lang="ts">
import { type MemberRoleDtoType, type UserRoleDtoType } from "@open-dpp/dto";
import RoleHeader from "./RoleHeader.vue";

const props = defineProps<{
  path: string;
  userRole: UserRoleDtoType;
  memberRole: MemberRoleDtoType | null;
}>();
</script>

<template>
  <IdShortPath :path="props.path" />
  <RoleHeader :user-role="props.userRole" :member-role="props.memberRole" />
</template>

<style scoped></style>
