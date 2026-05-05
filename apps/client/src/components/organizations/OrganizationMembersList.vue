<script lang="ts" setup>
import type { MemberDto } from "@open-dpp/api-client";
import type { InvitationStatus } from "better-auth/plugins";
import { UserCircleIcon } from "@heroicons/vue/24/solid";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { authClient } from "../../auth-client.ts";
import { ModalType, useLayoutStore } from "../../stores/layout";
import InviteMemberDialog from "./InviteMemberDialog.vue";

interface InvitedMember {
  id: string;
  organizationId: string;
  email: string;
  role: "member" | "admin" | "owner";
  status: InvitationStatus;
  inviterId: string;
  expiresAt: Date;
}

const { members } = defineProps<{
  organizationId: string;
  members: Array<MemberDto>;
}>();

const { t } = useI18n();
const layoutStore = useLayoutStore();

const invitations = ref<InvitedMember[]>([]);

const rows = computed(() =>
  [...members, ...invitations.value].sort((a, b) => a.role.localeCompare(b.role)),
);
async function loadInvitations() {
  const { data } = await authClient.organization.listInvitations();
  if (data) {
    invitations.value = data.filter((inv) => inv.status === "pending");
  }
}

async function cancelInvite(invitationId: string) {
  await authClient.organization.cancelInvitation({
    invitationId,
  });
  await loadInvitations();
}

function isMember(object: any): object is MemberDto {
  return "userId" in object;
}

function isInvited(object: any): object is InvitedMember {
  return "status" in object;
}

onMounted(async () => {
  await loadInvitations();
});
</script>

<template>
  <InviteMemberDialog
    v-if="layoutStore.modalOpen === ModalType.INVITE_MEMBER_MODAL"
    :organization-id="organizationId"
    @close="layoutStore.closeModal()"
    @invited-user="loadInvitations"
  />
  <DataTable :value="rows">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{ t("organizations.member", 2) }}</span>
        <div class="flex items-center gap-2">
          <Button
            :label="t('organizations.inviteUser')"
            @click="layoutStore.openModal(ModalType.INVITE_MEMBER_MODAL)"
          />
        </div>
      </div>
    </template>
    <Column field="name" :header="t('organizations.memberName')">
      <template #body="{ data }: { data: MemberDto | InvitedMember }">
        <div class="flex items-center">
          <div class="h-11 w-11 shrink-0">
            <UserCircleIcon class="h-11 w-11 rounded-full text-gray-700" />
          </div>
          <div v-if="isMember(data)" class="ml-4">
            <div class="font-medium text-gray-900">
              {{ data.user?.name || data.user?.email }}
            </div>
            <div class="mt-1 text-gray-500">
              {{ data.user?.email }}
            </div>
          </div>
          <div v-else-if="isInvited(data)" class="ml-4">
            <div class="font-medium text-gray-900">
              {{ data.email }}
            </div>
            <div class="mt-1 text-gray-500">
              {{ data.status }}
            </div>
          </div>
        </div>
      </template>
    </Column>
    <Column field="role" :header="t('organizations.memberRole')">
      <template #body="{ data }: { data: MemberDto }">
        <div v-if="data.role === 'owner'" class="text-gray-900">
          {{ t("organizations.owner") }}
        </div>
        <div v-else-if="data.role === 'admin'" class="text-gray-500">
          {{ t("user.admin") }}
        </div>
        <div v-else class="text-gray-500">
          {{ t("organizations.member") }}
        </div>
      </template>
    </Column>
    <Column :header="t('common.actions')">
      <template #body="{ data }: { data: MemberDto | InvitedMember }">
        <Button v-if="isInvited(data)" severity="secondary" @click="cancelInvite(data.id)">
          {{ t("organizations.invitation.cancel") }}
        </Button>
      </template>
    </Column>
  </DataTable>
</template>
