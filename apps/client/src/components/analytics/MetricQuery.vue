<script setup lang="ts">
import type { AutoCompleteCompleteEvent } from "primevue";
import type { Option } from "../../lib/combobox";
import { MeasurementType } from "@open-dpp/api-client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { AutoComplete, DatePicker, Select } from "primevue";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod/v4";
import { VIEW_ROOT_URL } from "../../const";
import { getNowInCurrentTimezone } from "../../lib/time.ts";
import { TimeView, useAnalyticsStore } from "../../stores/analytics";
import { useModelsStore } from "../../stores/models";
import BaseButton from "../basics/BaseButton.vue";

dayjs.extend(utc);

const { t } = useI18n();
const modelStore = useModelsStore();
const analyticsStore = useAnalyticsStore();

const timeViewOptions = Object.values(TimeView).map(value => ({
  id: value,
  label: t(`analytics.${value}`),
}));

const selectedDate = ref<Date>();
const range = ref<Date[]>();
const selectedView = ref<string>(timeViewOptions[0]!.id);

const modelOptions = computed(() =>
  modelStore.models.map(m => ({ label: `${m.name}`, id: m.id })),
);
const selectedModel = ref<Option | null>(null);
const selectedTemplate = ref<string | null>(null);
const items = ref<Option[]>([]);

const isQueryValid = computed(() => {
  return selectedModel.value && selectedView.value && selectedTemplate.value && range.value && range.value.length === 2;
});

function selectRange(date: Date) {
  const currentDate = dayjs(date);
  const units: { [key in TimeView]: dayjs.OpUnitType } = {
    [TimeView.DAYLY]: "day",
    [TimeView.WEEKLY]: "week",
    [TimeView.MONTHLY]: "month",
    [TimeView.YEARLY]: "year",
  };

  const unit = units[z.enum(TimeView).parse(selectedView.value)];
  range.value = [currentDate.startOf(unit).toDate(), currentDate.endOf(unit).toDate()];
}

watch(
  () => selectedView.value, // The store property to watch
  async (newView) => {
    if (newView) {
      selectedDate.value = getNowInCurrentTimezone();
      selectRange(selectedDate.value);
    }
  },
  { immediate: true },
);

watch(
  () => selectedModel.value?.id, // The store property to watch
  async (newModelId) => {
    if (newModelId) {
      const model = await modelStore.getModelById(newModelId);
      selectedTemplate.value = model.templateId;
    }
  },
  { immediate: true },
);

function getViewDomain() {
  const url = new URL(VIEW_ROOT_URL);
  return `${url.protocol}//${url.hostname}`;
}

async function applyQuery() {
  if (isQueryValid.value) {
    const [startDate, endDate] = range.value!;
    const metricQuery = {
      startDate: startDate!,
      endDate: endDate!,
      templateId: selectedTemplate.value!,
      modelId: selectedModel.value!.id,
      valueKey: getViewDomain(),
      type: MeasurementType.PAGE_VIEWS,
      selectedView: z.enum(TimeView).parse(selectedView.value),
    };
    await analyticsStore.queryMetric(metricQuery);
  }
}

function search(event: AutoCompleteCompleteEvent) {
  items.value = event.query
    ? modelOptions.value.filter((option: Option) => {
        return option.label.toLowerCase().includes(event.query.toLowerCase());
      })
    : modelOptions.value;
}

onMounted(async () => {
  await modelStore.getModels();
});
</script>

<template>
  <div class="flex items-center gap-2">
    <AutoComplete v-model="selectedModel" option-value="id" option-label="label" :placeholder="t('analytics.passportSelection')" dropdown :suggestions="items" @complete="search" />
    <Select v-model="selectedView" :options="timeViewOptions" option-value="id" option-label="label" :placeholder="t('analytics.timeViewSelection')" class="w-full md:w-56" />
    <DatePicker
      v-if="selectedView === TimeView.DAYLY" v-model="selectedDate"
      show-icon date-format="dd/mm/yy" @date-select="selectRange"
    />
    <DatePicker
      v-else-if="selectedView === TimeView.WEEKLY"
      v-model="range"
      selection-mode="range"
      show-icon
      date-format="dd.mm.yy"
      :manual-input="false"
      placeholder="Pick a week"
      @date-select="selectRange"
    />
    <DatePicker
      v-else-if="selectedView === TimeView.MONTHLY"
      v-model="selectedDate" show-icon view="month" date-format="mm/yy" @date-select="selectRange"
    />
    <DatePicker
      v-else-if="selectedView === TimeView.YEARLY"
      v-model="selectedDate" show-icon view="year" date-format="yy" @date-select="selectRange"
    />
    <BaseButton variant="primary" :disabled="!isQueryValid" @click="applyQuery">
      {{ t('analytics.startAnalysis') }}
    </BaseButton>
  </div>
</template>
