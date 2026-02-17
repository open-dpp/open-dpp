<script lang="ts" setup>
import type { MemberDto } from "@open-dpp/api-client";
import { UserCircleIcon } from "@heroicons/vue/24/solid";
import { useI18n } from "vue-i18n";
import { ModalType, useLayoutStore } from "../../stores/layout";
import InviteMemberDialog from "./InviteMemberDialog.vue";

defineProps<{
  organizationId: string;
  members: Array<MemberDto>;
}>();
const emit = defineEmits<{
  (e: "invitedUser"): void;
}>();
const { t } = useI18n();
const layoutStore = useLayoutStore();
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold leading-6 text-gray-900">
          {{ t('organizations.member') }}
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          {{ t('organizations.memberListDescription') }}
        </p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <InviteMemberDialog
          v-if="layoutStore.modalOpen === ModalType.INVITE_MEMBER_MODAL"
          :organization-id="organizationId"
          @close="layoutStore.closeModal()"
          @invited-user="emit('invitedUser')"
        />
        <button
          class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          type="button"
          @click="layoutStore.openModal(ModalType.INVITE_MEMBER_MODAL)"
        >
          {{ t('organizations.inviteUser') }}
        </button>
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
                <th
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  scope="col"
                >
                  {{ t('organizations.memberRole') }}
                </th>
                <th class="relative py-3.5 pl-3 pr-4 sm:pr-0" scope="col">
                  <span class="sr-only">{{ t('common.edit') }}</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="member in members" :key="member.id">
                <td class="whitespace-nowrap py-5 pl-4 pr-3 text-sm sm:pl-0">
                  <div class="flex items-center">
                    <div class="h-11 w-11 shrink-0">
                      <UserCircleIcon class="h-11 w-11 rounded-full text-gray-700" />
                    </div>
                    <div class="ml-4">
                      <div class="font-medium text-gray-900">
                        {{ member.user?.email }}
                      </div>
                      <div class="mt-1 text-gray-500">
                        {{ member.user?.email }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="whitespace-nowrap px-3 py-5 text-sm text-gray-500">
                  <div
                    v-if="member.role === 'owner'"
                    class="text-gray-900"
                  >
                    {{ t('organizations.memberCreator') }}
                  </div>
                  <div
                    v-if="member.role === 'admin'"
                    class="mt-1 text-gray-500"
                  >
                    {{ t('organizations.memberAdmin') }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
