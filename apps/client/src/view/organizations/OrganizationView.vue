<script lang="ts" setup>
import type { OrganizationDto } from "@open-dpp/api-client";
import { UserCircleIcon } from "@heroicons/vue/20/solid";
import { onMounted, ref } from "vue";
import BaseButton from "../../components/BaseButton.vue";
import apiClient from "../../lib/api-client";

const props = defineProps<{
  organizationId: string;
}>();

const userEmailToAdd = ref<string>("");
const organization = ref<OrganizationDto>();

async function inviteUserToOrg() {
  if (userEmailToAdd.value) {
    const response = await apiClient.dpp.organizations.inviteUser(
      userEmailToAdd.value,
      props.organizationId,
    );
    if (response.status === 201) {
      await fetchOrganization();
      userEmailToAdd.value = "";
    }
  }
}

async function fetchOrganization() {
  const response = await apiClient.dpp.organizations.getById(
    props.organizationId,
  );
  organization.value = response.data;
}

onMounted(async () => {
  await fetchOrganization();
});
</script>

<template>
  <div class="overflow-hidden bg-white shadow-sm sm:rounded-lg">
    <div class="px-4 py-6 sm:px-6">
      <h3 class="text-base/7 font-semibold text-gray-900">
        {{ t('organizations.info') }}
      </h3>
      <p class="mt-1 max-w-2xl text-sm/6 text-gray-500">
        {{ t('organizations.details') }}
      </p>
    </div>
    <div v-if="organization" class="border-t border-gray-100">
      <dl class="divide-y divide-gray-100">
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-900">
            {{ t('organizations.form.id') }}
          </dt>
          <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ organization.id }}
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-900">
            {{ t('organizations.form.name.label') }}
          </dt>
          <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ organization.name }}
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-900">
            {{ t('organizations.form.createdBy') }}
          </dt>
          <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ organization.createdByUserId }}
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-900">
            {{ t('organizations.form.administeredBy') }}
          </dt>
          <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ organization.ownedByUserId }}
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-900">
            {{ t('organizations.form.description') }}
          </dt>
          <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
            Fugiat ipsum ipsum deserunt culpa aute sint do nostrud anim
            incididunt cillum culpa consequat. Excepteur qui ipsum aliquip
            consequat sint. Sit id mollit nulla mollit nostrud in ea officia
            proident. Irure nostrud pariatur mollit ad adipisicing reprehenderit
            deserunt qui eu.
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm/6 font-medium text-gray-900">
            User
          </dt>
          <dd class="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
            <ul
              class="divide-y divide-gray-100 rounded-md border border-gray-200"
              role="list"
            >
              <li
                v-for="member of organization.members"
                :key="member.id"
                class="flex items-center justify-between py-4 pl-4 pr-5 text-sm/6"
              >
                <div class="flex w-0 flex-1 items-center">
                  <UserCircleIcon
                    aria-hidden="true"
                    class="h-5 w-5 shrink-0 text-gray-400"
                  />
                  <div class="ml-4 flex min-w-0 flex-1 gap-2">
                    <span class="truncate font-medium">{{ member.email }}</span>
                    <span
                      v-if="organization.ownedByUserId === member.id"
                      class="inline-flex shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
                      >{{ t('organizations.memberAdmin') }}</span
                    >
                    <span
                      v-if="organization.createdByUserId === member.id"
                      class="inline-flex shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
                      >{{ t('organizations.memberCreator') }}</span
                    >
                  </div>
                </div>
                <div class="ml-4 shrink-0">
                  <a
                    class="font-medium text-red-600 hover:text-red-500"
                    href="#"
                  >
                    {{ t('common.remove') }}
                  </a>
                </div>
              </li>
            </ul>
            <div class="mt-3 flex flex-row gap-3">
              <input
                v-model="userEmailToAdd"
                class="block rounded-md border-gray-300 min-w-80"
                :placeholder="t('common.form.email.label')"
                type="text"
              >
              <BaseButton
                variant="primary"
                type="button"
                @click="inviteUserToOrg"
                >{{ t('organizations.addUser') }}</BaseButton
              >
            </div>
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
