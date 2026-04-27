<script lang="ts" setup>
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/vue";
import { ChevronUpDownIcon } from "@heroicons/vue/16/solid";
import { CheckIcon, ListBulletIcon, PlusCircleIcon } from "@heroicons/vue/20/solid";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useIndexStore } from "../../stores";
import { useOrganizationsStore } from "../../stores/organizations";
import apiClient from "../../lib/api-client.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import { useUserStore } from "../../stores/user.ts";
import { UserRoleDto } from "@open-dpp/dto";
import { useInstanceSettings } from "../../composables/instance.settings.ts";

const organizationsStore = useOrganizationsStore();
const indexStore = useIndexStore();
const router = useRouter();
const { t } = useI18n();

const { canCreateOrganization, fetchInstanceSettings } = useInstanceSettings();

const nameOfSelectedOrganization = computed(() => {
  if (indexStore.selectedOrganization) {
    return organizationsStore.organizations.find(
      (org) => org.id === indexStore.selectedOrganization,
    )?.name;
  }
  return "Auswählen";
});

onMounted(async () => {
  await fetchInstanceSettings();
});

function setOrganization(organizationId: string) {
  indexStore.selectOrganization(organizationId);
  router.push("/");
}
</script>

<template>
  <Listbox
    as="div"
    :model-value="indexStore.selectedOrganization"
    @update:model-value="(org) => setOrganization(org.id)"
  >
    <ListboxLabel class="block text-sm/6 font-medium text-gray-900">
      {{ t("organizations.select") }}
    </ListboxLabel>
    <div class="relative flex flex-row gap-2">
      <div v-if="organizationsStore.organizations.length > 0" class="mt-2 flex grow">
        <ListboxButton
          data-cy="organizationSelect"
          class="focus:outline-primary-600 grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 outline -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6"
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
            class="absolute -top-[calc(200%-8px)] z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden sm:text-sm"
          >
            <ListboxOption
              v-for="organization in organizationsStore.organizations"
              :key="organization.id"
              v-slot="{ active, selected }"
              as="oldTemplate"
              :data-cy="organization.id"
              :value="organization"
            >
              <li
                class="relative cursor-default py-2 pr-4 pl-8 select-none"
                :class="[active ? 'bg-primary-600 text-white outline-hidden' : 'text-gray-900']"
              >
                <span
                  class="block truncate"
                  :class="[selected ? 'font-semibold' : 'font-normal']"
                  >{{ organization.name }}</span
                >
                <span
                  v-if="selected"
                  class="absolute inset-y-0 left-0 flex items-center pl-1.5"
                  :class="[active ? 'text-white' : 'text-primary-600']"
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
          v-if="canCreateOrganization"
          type="button"
          class="bg-primary-500 hover:bg-primary-600 mt-2 flex items-center rounded-sm p-2 text-white"
        >
          <PlusCircleIcon class="size-5" />
          <span v-if="organizationsStore.organizations.length === 0" class="text-md pl-1">{{
            t("organizations.new")
          }}</span>
        </button>
      </router-link>
      <router-link v-if="false" to="/organizations">
        <button
          type="button"
          class="bg-primary-600 mt-2 flex items-center rounded-sm p-2 text-white"
        >
          <ListBulletIcon class="size-5" />
        </button>
      </router-link>
    </div>
  </Listbox>
</template>
