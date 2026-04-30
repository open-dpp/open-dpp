<script lang="ts" setup>
import { PlusCircleIcon } from "@heroicons/vue/20/solid";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useIndexStore } from "../../stores";
import { useOrganizationsStore } from "../../stores/organizations";

const organizationsStore = useOrganizationsStore();
const indexStore = useIndexStore();
const router = useRouter();
const { t } = useI18n();

function setOrganization(organizationId: string) {
  indexStore.selectOrganization(organizationId);
  router.push("/");
}
</script>

<template>
  <div class="flex items-center justify-center gap-2">
    <Select
      class="w-full"
      :model-value="indexStore.selectedOrganization"
      @update:model-value="setOrganization($event)"
      :options="organizationsStore.organizations"
      optionLabel="name"
      optionValue="id"
    ></Select>
    <RouterLink
      to="/organizations/create"
      tag="button"
      type="button"
      class="bg-primary-500 hover:bg-primary-600 flex items-center rounded-sm p-2 text-white"
    >
      <PlusCircleIcon class="size-5" />
      <span v-if="organizationsStore.organizations.length === 0" class="text-md pl-1">{{
        t("organizations.new")
      }}</span>
    </RouterLink>
  </div>
</template>
