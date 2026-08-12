<script lang="ts" setup>
import type { LocationQueryRaw } from "vue-router";
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { AasSubmodelElements } from "@open-dpp/dto";
import { ChevronRightIcon } from "@heroicons/vue/16/solid";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { childElementsOf } from "../../lib/presentation/table.ts";
import { router } from "../../router";

const { element, query, hash } = defineProps<{
  element: SubmodelElementResponseDto;
  query: LocationQueryRaw;
  hash?: string;
}>();

const { t } = useI18n();

const rowCount = computed(
  () => childElementsOf(element, AasSubmodelElements.SubmodelElementList)?.length ?? 0,
);

function navigateToTable() {
  router.push({ query, hash });
}
</script>

<template>
  <Button
    type="button"
    :label="t('presentation.table.rows')"
    v-tooltip.top="t('presentation.table.viewTable')"
    :aria-label="t('presentation.table.viewTable')"
    icon="pi pi-table"
    :badge="rowCount.toFixed()"
    @click="navigateToTable"
    :disabled="rowCount === 0"
  />
</template>
