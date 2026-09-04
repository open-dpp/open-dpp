<script lang="ts" setup>
import type { MemberDto } from "@open-dpp/api-client";
import type { InvitationStatus } from "better-auth/plugins";
import { UserCircleIcon } from "@heroicons/vue/24/solid";
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { authClient } from "../../auth-client.ts";
import { useOrganizations } from "../../composables/organizations.ts";
import ChangeMemberRoleDialog from "./ChangeMemberRoleDialog.vue";
import InviteMemberDialog from "./InviteMemberDialog.vue";
import { useUserStore } from "../../stores/user.ts";
import { MemberRoleDto } from "@open-dpp/dto";

interface InvitedMember {
  id: string;
  organizationId: string;
  email: string;
  role: "member" | "admin" | "owner";
  status: InvitationStatus;
  inviterId: string;
  expiresAt: Date;
}

const emit = defineEmits<{
  (e: "refresh"): void;
}>();

const { members } = defineProps<{
  organizationId: string;
  members: Array<MemberDto>;
}>();

const { t } = useI18n();
const { asSubject, user } = useUserStore();

const invitations = ref<InvitedMember[]>([]);
const changeRoleMember = ref<MemberDto | null>(null);
const inviteMemberDialog = useTemplateRef("inviteMemberDialog");

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

function onChangeRoleSuccess() {
  emit("refresh");
  changeRoleMember.value = null;
}

function onChangeRoleClose() {
  changeRoleMember.value = null;
}

function isMember(object: any): object is MemberDto {
  return "userId" in object;
}

function isInvited(object: any): object is InvitedMember {
  return "status" in object;
}

function canChangeRole(member: MemberDto): boolean {
  const subject = asSubject(false);

  return (
    isMember(member) && member.userId !== user.id && subject.memberRole === MemberRoleDto.OWNER
  );
}

const { removeMember } = useOrganizations();

function canRemoveMember(member: MemberDto): boolean {
  return canChangeRole(member) && member.role !== MemberRoleDto.OWNER;
}

function onRemoveMember(member: MemberDto) {
  removeMember(member, () => emit("refresh"));
}

onMounted(async () => {
  await loadInvitations();
});
</script>

<template>
  <ChangeMemberRoleDialog
    v-if="changeRoleMember"
    :user-id="changeRoleMember.userId"
    :user-email="changeRoleMember.user?.email || ''"
    :current-role="changeRoleMember.role"
    :member-id="changeRoleMember.id"
    @close="onChangeRoleClose"
    @success="onChangeRoleSuccess"
  />
  <InviteMemberDialog ref="inviteMemberDialog" @success="loadInvitations" />
  <DataTable :value="rows">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{ t("organizations.member", 2) }}</span>
        <div class="flex items-center gap-2">
          <Button
            :label="t('organizations.inviteUser')"
            @click="inviteMemberDialog?.openDialog(organizationId)"
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
        <div v-else class="flex gap-2">
          <Button v-if="canChangeRole(data)" severity="secondary" @click="changeRoleMember = data">
            {{ t("organizations.admin.changeRoleDialog.change") }}
          </Button>
          <Button v-if="canRemoveMember(data)" severity="danger" @click="onRemoveMember(data)">
            {{ t("common.remove") }}
          </Button>
        </div>
      </template>
    </Column>
  </DataTable>
</template>
