<script lang="ts" setup>
import type { InvitationStatus } from "better-auth/plugins";
import { UserCircleIcon } from "@heroicons/vue/24/solid";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { authClient } from "../../auth-client.ts";
import BaseButton from "../basics/BaseButton.vue";

const { t } = useI18n();

const invitations = ref<Array<{
  id: string;
  organizationId: string;
  email: string;
  role: "member" | "admin" | "owner";
  status: InvitationStatus;
  inviterId: string;
  expiresAt: Date;
}>>([]);

async function loadInvitations() {
  invitations.value = [];
  const { data } = await authClient.organization.listInvitations();
  if (data) {
    for (const invitation of data) {
      if (invitation.status === "pending") {
        invitations.value.push(invitation);
      }
    }
  }
}

async function cancelInvite(invitationId: string) {
  await authClient.organization.cancelInvitation({
    invitationId,
  });
  await loadInvitations();
}

onMounted(async () => {
  await loadInvitations();
});
</script>

<template>
  <div v-if="invitations.length > 0" class="mt-8 pb-10">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold leading-6 text-gray-900">
          {{ t('organizations.organizationInvitations.title') }}
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          {{ t('organizations.organizationInvitations.description') }}
        </p>
      </div>
    </div>
    <div class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table class="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th
                  class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                  scope="col"
                >
                  {{ t('organizations.memberName') }}
                </th>
                <th class="relative py-3.5 pl-3 pr-4 sm:pr-0" scope="col">
                  <span class="sr-only">{{ t('common.edit') }}</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="invitation in invitations" :key="invitation.id">
                <td class="whitespace-nowrap py-5 pl-4 pr-3 text-sm sm:pl-0">
                  <div class="flex items-center">
                    <div class="h-11 w-11 shrink-0">
                      <UserCircleIcon class="h-11 w-11 rounded-full" />
                    </div>
                    <div class="ml-4">
                      <div class="font-medium text-gray-900">
                        {{ invitation.email }}
                      </div>
                      <div class="mt-1 text-gray-500">
                        {{ invitation.status }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="whitespace-nowrap px-3 py-5 text-sm text-gray-500">
                  <BaseButton @click="cancelInvite(invitation.id)">
                    {{ t('organizations.invitation.cancel') }}
                  </BaseButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
