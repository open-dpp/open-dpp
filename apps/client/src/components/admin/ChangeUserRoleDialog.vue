<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client.ts";
import ChangeRoleDialog from "./ChangeRoleDialog.vue";
import { UserRoleDto, UserRoleDtoEnum } from "@open-dpp/dto";

const userId = ref("");
const userEmail = ref("");
const currentRole = ref("");

const emit = defineEmits<{
  (e: "success"): void;
}>();

const visible = ref(false);

const { t } = useI18n();

const roleOptions = computed(() => [
  {
    label: t("organizations.admin.changeRoleDialog.roleAdmin"),
    value: UserRoleDto.ADMIN,
  },
  {
    label: t("organizations.admin.changeRoleDialog.roleUser"),
    value: UserRoleDto.USER,
  },
]);

async function onSave(role: string) {
  await apiClient.dpp.users.setRole(userId.value, {
    role: UserRoleDtoEnum.parse(role),
  });
}

async function openDialog(id: string, email: string, role: string) {
  userId.value = id;
  userEmail.value = email;
  currentRole.value = role;
  visible.value = true;
}

defineExpose({
  openDialog,
});
</script>

<template>
  <ChangeRoleDialog
    v-if="visible"
    :user-id="userId"
    :user-email="userEmail"
    :current-role="currentRole"
    :role-options="roleOptions"
    :escalation-role="UserRoleDto.ADMIN"
    :on-save="onSave"
    @close="visible = false"
    @success="
      emit('success');
      visible = false;
    "
  />
</template>
