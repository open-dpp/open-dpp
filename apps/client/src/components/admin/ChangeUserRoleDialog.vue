<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client.ts";
import ChangeRoleDialog from "./ChangeRoleDialog.vue";
import { UserRoleDto, UserRoleDtoEnum } from "@open-dpp/dto";

const props = defineProps<{
  userId: string;
  userEmail: string;
  currentRole: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "success"): void;
}>();

const { t } = useI18n();

const roleOptions = computed(() => [
  { label: t("organizations.admin.changeRoleDialog.roleAdmin"), value: UserRoleDto.ADMIN },
  { label: t("organizations.admin.changeRoleDialog.roleUser"), value: UserRoleDto.USER },
]);

async function onSave(role: string) {
  await apiClient.dpp.users.setRole(props.userId, {
    role: UserRoleDtoEnum.parse(role),
  });
}
</script>

<template>
  <ChangeRoleDialog
    v-bind="props"
    :role-options="roleOptions"
    :escalation-role="UserRoleDto.ADMIN"
    :on-save="onSave"
    @close="emit('close')"
    @success="emit('success')"
  />
</template>
