<script lang="ts" setup>
import type { UserWithRole } from "better-auth/plugins";
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { authClient } from "../../auth-client.ts";
import AdminUsersList from "../../components/admin/AdminUsersList.vue";
import ChangeUserRoleDialog from "../../components/admin/ChangeUserRoleDialog.vue";
import InviteToOrganizationDialog from "../../components/admin/InviteToOrganizationDialog.vue";
import InviteUserDialog from "../../components/admin/InviteUserDialog.vue";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import { useUsersRepo } from "../../composables/users-repo.ts";

const errorHandlingStore = useErrorHandlingStore();

const session = authClient.useSession();
const currentUserRole = computed(() => session.value.data?.user.role ?? "user");
const currentUserId = computed(() => session.value.data?.user.id);
const { resendPasswordReset, resendVerificationEmail } = useUsersRepo();

const users = ref<UserWithRole[]>([]);

const inviteToOrganizationDialog = useTemplateRef("inviteToOrganizationDialog");
const inviteUserDialog = useTemplateRef("inviteUserDialog");
const changeRoleDialog = useTemplateRef("changeUserRoleDialog");

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

onMounted(async () => {
  await fetchUsers();
});
</script>

<template>
  <section>
    <div class="flex flex-col gap-3 p-3">
      <InviteUserDialog ref="inviteUserDialog" @success="fetchUsers" />
      <InviteToOrganizationDialog ref="inviteToOrganizationDialog" />
      <ChangeUserRoleDialog ref="changeUserRoleDialog" @success="fetchUsers" />
      <AdminUsersList
        :users="users"
        :current-user-role="currentUserRole"
        :current-user-id="currentUserId"
        @add="inviteUserDialog?.openInviteDialog"
        @invite-to-org="inviteToOrganizationDialog?.openInviteDialog"
        @change-role="changeRoleDialog?.openDialog"
        @resend-password-reset="resendPasswordReset"
        @resend-verification-email="resendVerificationEmail"
      />
    </div>
  </section>
</template>
