<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useOrganizations } from "../../composables/organizations.ts";
import ChangeRoleDialog from "../admin/ChangeRoleDialog.vue";
import { MemberRoleDto, MemberRoleDtoEnum } from "@open-dpp/dto";

const props = defineProps<{
  userId: string;
  userEmail: string;
  currentRole: string;
  memberId: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "success"): void;
}>();

const { t } = useI18n();
const { changeMemberRole } = useOrganizations();

const roleOptions = computed(() =>
  Object.values(MemberRoleDto).map((role) => ({
    label: t(`organizations.${role}`),
    value: role,
  })),
);

async function onSave(role: string) {
  await changeMemberRole(props.memberId, MemberRoleDtoEnum.parse(role));
}
</script>

<template>
  <ChangeRoleDialog
    v-bind="props"
    :escalation-role="MemberRoleDto.OWNER"
    :role-options="roleOptions"
    :on-save="onSave"
    @close="emit('close')"
    @success="emit('success')"
  />
</template>
