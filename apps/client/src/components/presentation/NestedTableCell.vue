<script lang="ts" setup>
import type { LocationQueryRaw } from "vue-router";
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { AasSubmodelElements } from "@open-dpp/dto";
import { ChevronRightIcon } from "@heroicons/vue/16/solid";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { childElementsOf } from "../../lib/presentation/table.ts";

const { element, query } = defineProps<{
  element: SubmodelElementResponseDto;
  query: LocationQueryRaw;
  hash?: string;
}>();

const { t } = useI18n();

const rowCount = computed(
  () => childElementsOf(element, AasSubmodelElements.SubmodelElementList)?.length ?? 0,
);
</script>

<template>
  <router-link
    v-if="rowCount > 0"
    :to="{ query, hash }"
    class="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
  >
    <span>{{ t("presentation.table.viewTable", { count: rowCount }) }}</span>
    <ChevronRightIcon class="size-4 shrink-0" aria-hidden="true" />
  </router-link>
  <span v-else class="text-sm text-gray-500">
    {{ t("presentation.table.rowCount", { count: rowCount }) }}
  </span>
</template>
