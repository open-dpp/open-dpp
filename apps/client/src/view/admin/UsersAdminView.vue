<script lang="ts" setup>
import type { UserWithRole } from "better-auth/plugins";
import { computed, onMounted, ref } from "vue";
import { authClient } from "../../auth-client.ts";
import AdminUsersList from "../../components/admin/AdminUsersList.vue";
import ChangeRoleDialog from "../../components/admin/ChangeRoleDialog.vue";
import InviteToOrganizationDialog from "../../components/admin/InviteToOrganizationDialog.vue";
import InviteUserDialog from "../../components/admin/InviteUserDialog.vue";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import { ModalType, useLayoutStore } from "../../stores/layout.ts";

const layoutStore = useLayoutStore();
const errorHandlingStore = useErrorHandlingStore();

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
      <ChangeRoleDialog
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
      />
    </div>
  </section>
</template>
