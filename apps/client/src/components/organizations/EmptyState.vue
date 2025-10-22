<script lang="ts" setup>
import { BuildingOfficeIcon } from "@heroicons/vue/24/outline";
import { useI18n } from "vue-i18n";

const emits = defineEmits<{
  (e: "add"): void;
}>();
const { t } = useI18n();
</script>

<template>
  <button
    class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    type="button"
    @click="emits('add')"
  >
    <BuildingOfficeIcon class="size-32 mx-auto" />
    <span class="mt-2 block text-sm font-semibold text-gray-900">{{
      t('organizations.new')
    }}</span>
  </button>
</template>
