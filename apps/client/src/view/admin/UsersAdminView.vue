<script lang="ts" setup>
import type { UserWithRole } from "better-auth/plugins";
import { onMounted, ref } from "vue";
import { authClient } from "../../auth-client.ts";
import AdminUsersList from "../../components/admin/AdminUsersList.vue";
import InviteUserDialog from "../../components/admin/InviteUserDialog.vue";
import { ModalType, useLayoutStore } from "../../stores/layout.ts";

const layoutStore = useLayoutStore();

const users = ref<UserWithRole[]>([]);

async function fetchUsers() {
  const res = await authClient.admin.listUsers({
    query: {},
  });
  if (res.data) {
    users.value = res.data.users;
  }
}

async function onAdd() {
  layoutStore.openModal(ModalType.INVITE_USER_MODAL);
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
      />
      <AdminUsersList v-if="users.length > 0" :users="users" @add="onAdd" />
    </div>
  </section>
</template>
