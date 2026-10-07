<script lang="ts" setup>
import {
  DigitalProductDocumentStatusDto,
  type DigitalProductDocumentStatusDtoType,
} from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import type { PeriodRange } from "../../composables/digital-product-document-list-filter.ts";
import { usePeriodInput } from "../../composables/period-input.ts";
import TemplateMultiSelect from "../template/TemplateMultiSelect.vue";

const {
  showStatus = true,
  showTemplates = false,
  hasActiveFilters = false,
} = defineProps<{
  // The status select is hidden where the status is fixed, e.g. exports only handle published passports.
  showStatus?: boolean;
  // Only passports have templates.
  showTemplates?: boolean;
  hasActiveFilters?: boolean;
}>();

const status = defineModel<DigitalProductDocumentStatusDtoType[]>("status", { default: () => [] });
const templateIds = defineModel<string[]>("templateIds", { default: () => [] });
const period = defineModel<PeriodRange | null>("period", { default: null });

const emits = defineEmits<{ (e: "reset"): void }>();

const { t } = useI18n();

const statusOptions = Object.values(DigitalProductDocumentStatusDto).map((value) => ({
  value,
  label: t(`status.${value.toLowerCase()}`),
}));

const {
  draft: periodDraft,
  onInput: onPeriodInput,
  onHide: onPeriodHide,
} = usePeriodInput(
  () => period.value,
  (newPeriod) => {
    period.value = newPeriod;
  },
);
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" data-cy="document-filter-bar">
    <MultiSelect
      v-if="showStatus"
      v-model="status"
      :options="statusOptions"
      option-label="label"
      option-value="value"
      display="chip"
      :show-toggle-all="false"
      :placeholder="t('status.selectStatus')"
      :aria-label="t('filter.status')"
      class="w-64"
      data-cy="document-filter-status"
    />
    <TemplateMultiSelect
      v-if="showTemplates"
      v-model="templateIds"
      class="w-72"
      data-cy="document-filter-templates"
    />
    <DatePicker
      :model-value="periodDraft"
      selection-mode="range"
      show-time
      hour-format="24"
      show-button-bar
      show-icon
      :manual-input="false"
      :placeholder="t('filter.createdBetween')"
      :aria-label="t('filter.createdBetween')"
      class="w-80"
      data-cy="document-filter-period"
      @update:model-value="onPeriodInput"
      @hide="onPeriodHide"
    />
    <Button
      v-if="hasActiveFilters"
      :label="t('filter.clear')"
      severity="secondary"
      text
      data-cy="document-filter-clear"
      @click="emits('reset')"
    />
  </div>
</template>
