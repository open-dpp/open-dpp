<template>
  <div class="">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">Organisationen</h1>
        <p class="mt-2 text-sm text-gray-700">
          Alle zugewiesenen Organisationen.
        </p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button
          class="block rounded-md bg-indigo-600 px-3 py-1.5 text-center text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          type="button"
        >
          <router-link to="/organizations/create"
            >Organisation erstellen
          </router-link>
        </button>
      </div>
    </div>
    <div class="mt-8 flow-root">
      <ul
        v-if="organizationsStore.organizations.length > 0"
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        <li
          v-for="organization in organizationsStore.organizations"
          :key="organization.id"
          :class="{
            'border-indigo-500 border-2':
              organization.id === indexStore.selectedOrganization,
          }"
          class="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow-sm"
        >
          <div class="flex w-full items-center justify-between space-x-6 p-6">
            <div>
              <FormKit
                :disabled="organization.id === indexStore.selectedOrganization"
                :label="
                  organization.id === indexStore.selectedOrganization
                    ? 'Ausgewählt'
                    : 'Auswählen'
                "
                :value="organization.id === indexStore.selectedOrganization"
                name="terms"
                type="checkbox"
                validation="accepted"
                validation-visibility="dirty"
                @input="setOrganization(organization.id)"
              />
            </div>
            <div class="flex-1 truncate">
              <div class="flex items-center space-x-3">
                <h3 class="truncate text-sm font-medium text-gray-900">
                  {{ organization.name }}
                </h3>
                <span
                  class="inline-flex shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
                  >Admin</span
                >
              </div>
              <p class="mt-1 truncate text-sm text-gray-500">
                {{ organization.id }}
              </p>
            </div>
            <div>
              <button
                class="flex flex-row flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
                @click="router.push(`/organizations/${organization.id}`)"
              >
                <Cog8ToothIcon
                  aria-hidden="true"
                  class="size-5 text-gray-400 hover:text-blue-500"
                />
              </button>
            </div>
          </div>
          <div>
            <div class="-mt-px flex divide-x divide-gray-200">
              <div
                v-if="organization.id != indexStore.selectedOrganization"
                class="flex w-0 flex-1"
              >
                <button
                  class="-mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
                  :data-cy="organization.id"
                  @click="setOrganization(organization.id)"
                >
                  <CheckIcon aria-hidden="true" class="size-5 text-gray-400" />
                  Auswählen
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
      <div v-else>
        <EmptyState @click="router.push('/organizations/create')" />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { CheckIcon, Cog8ToothIcon } from '@heroicons/vue/20/solid';
import { useIndexStore } from '../../stores';
import { useRouter } from 'vue-router';
import { useOrganizationsStore } from '../../stores/organizations';
import EmptyState from './EmptyState.vue';

const indexStore = useIndexStore();
const organizationsStore = useOrganizationsStore();
const router = useRouter();

const setOrganization = (organizationId: string) => {
  indexStore.selectOrganization(organizationId);
  router.push('/');
};
</script>
