<script setup lang="ts">
import type { MemberRoleDtoType, UserRoleDtoType } from "@open-dpp/dto";
import { useRoleHierarchy } from "../../composables/role-hierarchy.ts";

const props = defineProps<{
  userRole: UserRoleDtoType;
  memberRole: MemberRoleDtoType | null;
}>();
const { getRoleName } = useRoleHierarchy();
</script>

<template>
  <h3>
    {{ getRoleName({ userRole: props.userRole, memberRole: props.memberRole ?? undefined }) }}
  </h3>
</template>

<style scoped></style>
