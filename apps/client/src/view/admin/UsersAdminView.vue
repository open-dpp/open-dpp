<script lang="ts" setup>
import type { UserWithRole } from "better-auth/plugins";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { authClient } from "../../auth-client.ts";
import AdminUsersList from "../../components/admin/AdminUsersList.vue";
import ChangeUserRoleDialog from "../../components/admin/ChangeUserRoleDialog.vue";
import InviteToOrganizationDialog from "../../components/admin/InviteToOrganizationDialog.vue";
import InviteUserDialog from "../../components/admin/InviteUserDialog.vue";
import apiClient from "../../lib/api-client.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import { ModalType, useLayoutStore } from "../../stores/layout.ts";
import { useNotificationStore } from "../../stores/notification.ts";

const { t } = useI18n();
const layoutStore = useLayoutStore();
const errorHandlingStore = useErrorHandlingStore();
const notificationStore = useNotificationStore();

const session = authClient.useSession();
const currentUserRole = computed(() => session.value.data?.user.role ?? "user");

const users = ref<UserWithRole[]>([]);
const inviteToOrgEmail = ref<string | null>(null);
const changeRoleUser = ref<{ id: string; email: string; role: string } | null>(null);

async function fetchUsers() {
  try {
    const res = await authClient.admin.listUsers({
      query: {},
    });
    if (res.data) {
      users.value = res.data.users;
    }
  } catch (error) {
    errorHandlingStore.logErrorWithNotification("Failed to fetch users", error);
    users.value = [];
  }
}

async function onAdd() {
  layoutStore.openModal(ModalType.INVITE_USER_MODAL);
}

async function onInviteSuccess() {
  await fetchUsers();
  layoutStore.closeModal();
}

function onInviteToOrg(email: string) {
  inviteToOrgEmail.value = email;
}

function onInviteToOrgClose() {
  inviteToOrgEmail.value = null;
}

function onChangeRole(userId: string, email: string, role: string) {
  changeRoleUser.value = { id: userId, email, role };
}

async function onChangeRoleSuccess() {
  await fetchUsers();
  changeRoleUser.value = null;
}

function onChangeRoleClose() {
  changeRoleUser.value = null;
}

async function onResendPasswordReset(userId: string) {
  try {
    await apiClient.dpp.users.resendPasswordReset(userId);
    notificationStore.addSuccessNotification(t("organizations.admin.resendPasswordReset.success"));
  } catch (error) {
    errorHandlingStore.logErrorWithNotification(
      t("organizations.admin.resendPasswordReset.error"),
      error,
    );
  }
}

async function onResendVerificationEmail(userId: string) {
  try {
    await apiClient.dpp.users.resendVerificationEmail(userId);
    notificationStore.addSuccessNotification(
      t("organizations.admin.resendVerificationEmail.success"),
    );
  } catch (error) {
    errorHandlingStore.logErrorWithNotification(
      t("organizations.admin.resendVerificationEmail.error"),
      error,
    );
  }
}

onMounted(async () => {
  await fetchUsers();
});
</script>

<template>
  <section>
    <div class="flex flex-col gap-3 p-3">
      <InviteUserDialog
        v-if="layoutStore.modalOpen === ModalType.INVITE_USER_MODAL"
        @close="layoutStore.closeModal()"
        @success="onInviteSuccess"
      />
      <InviteToOrganizationDialog
        v-if="inviteToOrgEmail"
        :user-email="inviteToOrgEmail"
        @close="onInviteToOrgClose"
        @success="onInviteToOrgClose"
      />
      <ChangeUserRoleDialog
        v-if="changeRoleUser"
        :user-id="changeRoleUser.id"
        :user-email="changeRoleUser.email"
        :current-role="changeRoleUser.role"
        @close="onChangeRoleClose"
        @success="onChangeRoleSuccess"
      />
      <AdminUsersList
        :users="users"
        :current-user-role="currentUserRole"
        @add="onAdd"
        @invite-to-org="onInviteToOrg"
        @change-role="onChangeRole"
        @resend-password-reset="onResendPasswordReset"
        @resend-verification-email="onResendVerificationEmail"
      />
    </div>
  </section>
</template>
