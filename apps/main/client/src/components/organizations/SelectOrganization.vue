<template>
  <Listbox
    as="div"
    :model-value="indexStore.selectedOrganization"
    @update:model-value="(org) => setOrganization(org.id)"
  >
    <ListboxLabel class="block text-sm/6 font-medium text-gray-900"
      >Organisation wählen</ListboxLabel
    >
    <div class="relative flex flex-row gap-2">
      <div
        v-if="organizationsStore.organizations.length > 0"
        class="flex grow mt-2"
      >
        <ListboxButton
          data-cy="organizationSelect"
          class="grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pl-3 pr-2 text-left text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
        >
          <span class="col-start-1 row-start-1 truncate pr-6">{{
            nameOfSelectedOrganization
          }}</span>
          <ChevronUpDownIcon
            class="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4"
            aria-hidden="true"
          />
        </ListboxButton>

        <transition
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute z-10 mt-1 -top-[calc(200%-8px)] max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden sm:text-sm"
          >
            <ListboxOption
              as="template"
              v-for="organization in organizationsStore.organizations"
              :key="organization.id"
              :data-cy="organization.id"
              :value="organization"
              v-slot="{ active, selected }"
            >
              <li
                :class="[
                  active
                    ? 'bg-indigo-600 text-white outline-hidden'
                    : 'text-gray-900',
                  'relative cursor-default select-none py-2 pl-8 pr-4',
                ]"
              >
                <span
                  :class="[
                    selected ? 'font-semibold' : 'font-normal',
                    'block truncate',
                  ]"
                  >{{ organization.name }}</span
                >
                <span
                  v-if="selected"
                  :class="[
                    active ? 'text-white' : 'text-indigo-600',
                    'absolute inset-y-0 left-0 flex items-center pl-1.5',
                  ]"
                >
                  <CheckIcon class="size-5" aria-hidden="true" />
                </span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </transition>
      </div>
      <router-link to="/organizations/create">
        <button
          type="button"
          class="flex items-center p-2 rounded-sm mt-2 bg-indigo-500 text-white"
        >
          <PlusCircleIcon class="size-5" />
          <span
            v-if="organizationsStore.organizations.length === 0"
            class="text-md pl-1"
            >Organisation erstellen</span
          >
        </button>
      </router-link>
      <router-link v-if="false" to="/organizations">
        <button
          type="button"
          class="flex items-center p-2 rounded-sm mt-2 bg-indigo-700 text-white"
        >
          <ListBulletIcon class="size-5" />
        </button>
      </router-link>
    </div>
  </Listbox>
</template>

<script lang="ts" setup>
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue';
import { ChevronUpDownIcon } from '@heroicons/vue/16/solid';
import {
  CheckIcon,
  ListBulletIcon,
  PlusCircleIcon,
} from '@heroicons/vue/20/solid';
import { useOrganizationsStore } from '../../stores/organizations';
import { useIndexStore } from '../../stores';
import { useRouter } from 'vue-router';
import { computed } from 'vue';

const organizationsStore = useOrganizationsStore();
const indexStore = useIndexStore();
const router = useRouter();

const nameOfSelectedOrganization = computed(() => {
  if (indexStore.selectedOrganization) {
    return organizationsStore.organizations.find(
      (org) => org.id === indexStore.selectedOrganization,
    )?.name;
  }
  return 'Auswählen';
});

const setOrganization = (organizationId: string) => {
  indexStore.selectOrganization(organizationId);
  router.push('/');
};
</script>
