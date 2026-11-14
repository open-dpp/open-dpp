<script setup lang="ts">
import { type GuestRoleDtoType, type MemberRoleDtoType, type UserRoleDtoType } from "@open-dpp/dto";
import RoleHeader from "./RoleHeader.vue";

const props = defineProps<{
  path: string;
  userRole: UserRoleDtoType;
  memberRole: MemberRoleDtoType | null;
  guestRole?: GuestRoleDtoType | null;
}>();
</script>

<template>
  <IdShortPath :path="props.path" />
  <RoleHeader
    :user-role="props.userRole"
    :member-role="props.memberRole"
    :guest-role="props.guestRole"
  />
</template>

<style scoped></style>
