<script lang="ts" setup>
import {
  DigitalProductDocumentStatusDto,
  type DigitalProductDocumentStatusDtoType,
} from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import { usePeriodInput } from "../../composables/period-input.ts";
import type { DayPeriod } from "../../lib/day-period.ts";
import TemplateMultiSelect from "../template/TemplateMultiSelect.vue";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { computed } from "vue";

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
const period = defineModel<DayPeriod | null>("period", { default: null });

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

const breakpoints = useBreakpoints(breakpointsTailwind);
const maxSelectedLabels = computed(() => (breakpoints.greaterOrEqual("sm") ? 3 : 1));
</script>

<template>
  <div class="grid grid-cols-1 items-center gap-1 xl:grid-cols-9" data-cy="document-filter-bar">
    <MultiSelect
      v-if="showStatus"
      v-model="status"
      :options="statusOptions"
      class="col-span-2"
      fluid
      option-label="label"
      option-value="value"
      display="chip"
      :show-toggle-all="false"
      :max-selected-labels="maxSelectedLabels"
      :placeholder="t('status.selectStatus')"
      :aria-label="t('filter.status')"
      data-cy="document-filter-status"
    />
    <TemplateMultiSelect
      class="col-span-3"
      v-if="showTemplates"
      v-model="templateIds"
      :max-selected-labels="maxSelectedLabels"
      data-cy="document-filter-templates"
    />
    <DatePicker
      class="col-span-3"
      :model-value="periodDraft"
      selection-mode="range"
      show-button-bar
      show-icon
      :manual-input="false"
      :placeholder="t('filter.createdBetween')"
      :aria-label="t('filter.createdBetween')"
      data-cy="document-filter-period"
      @update:model-value="onPeriodInput"
      @hide="onPeriodHide"
    />
    <Button
      class="col-span-1"
      v-if="hasActiveFilters"
      :label="t('filter.clear')"
      severity="secondary"
      text
      data-cy="document-filter-clear"
      @click="emits('reset')"
    />
  </div>
</template>
