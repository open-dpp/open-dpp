<script lang="ts" setup>
import type { UserWithRole } from "better-auth/plugins";
import { onMounted, ref } from "vue";
import { authClient } from "../../auth-client.ts";
import AdminUsersList from "../../components/admin/AdminUsersList.vue";
import InviteToOrganizationDialog from "../../components/admin/InviteToOrganizationDialog.vue";
import InviteUserDialog from "../../components/admin/InviteUserDialog.vue";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import { ModalType, useLayoutStore } from "../../stores/layout.ts";

const layoutStore = useLayoutStore();
const errorHandlingStore = useErrorHandlingStore();

const users = ref<UserWithRole[]>([]);
const inviteToOrgEmail = ref<string | null>(null);

async function fetchUsers() {
  try {
    const res = await authClient.admin.listUsers({
      query: {},
    });
    if (res.data) {
      users.value = res.data.users;
    }
  }
  catch (error) {
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
      <AdminUsersList v-if="users.length > 0" :users="users" @add="onAdd" @invite-to-org="onInviteToOrg" />
    </div>
  </section>
</template>
