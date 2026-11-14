<script setup lang="ts">
import type { GuestRoleDtoType, MemberRoleDtoType, UserRoleDtoType } from "@open-dpp/dto";
import { useRoleHierarchy } from "../../composables/role-hierarchy.ts";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  userRole: UserRoleDtoType;
  memberRole: MemberRoleDtoType | null;
  guestRole?: GuestRoleDtoType | null;
}>();
const { getRoleName } = useRoleHierarchy();
const { t } = useI18n();
</script>

<template>
  <DescriptionTerm :dt="t('activityHistory.affectedRole')">{{
    getRoleName({
      userRole: props.userRole,
      memberRole: props.memberRole ?? undefined,
      guestRole: props.guestRole ?? undefined,
    })
  }}</DescriptionTerm>
</template>

<style scoped></style>
