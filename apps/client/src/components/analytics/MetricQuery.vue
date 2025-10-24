<script setup lang="ts">
import type { Option } from "../../lib/combobox";
import { MeasurementType } from "@open-dpp/api-client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DatePicker } from "primevue";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod/v4";
import { VIEW_ROOT_URL } from "../../const";
import { getNowInCurrentTimezone } from "../../lib/time.ts";
import { TimeView, useAnalyticsStore } from "../../stores/analytics";
import { useModelsStore } from "../../stores/models";
import BaseButton from "../basics/BaseButton.vue";
import Combobox from "../basics/Combobox.vue";
import Select from "../basics/Select.vue";

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
const selectedView = ref<Option>(timeViewOptions[0]!);

const modelOptions = computed(() =>
  modelStore.models.map(m => ({ label: `${m.name}`, id: m.id })),
);
const selectedModel = ref<Option | null>(null);
const selectedTemplate = ref<string | null>(null);

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

  const unit = units[z.enum(TimeView).parse(selectedView.value.id)];
  range.value = [currentDate.startOf(unit).toDate(), currentDate.endOf(unit).toDate()];
}

watch(
  () => selectedView.value?.id, // The store property to watch
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
      selectedView: z.enum(TimeView).parse(selectedView.value.id),
    };
    await analyticsStore.queryMetric(metricQuery);
  }
}

onMounted(async () => {
  await modelStore.getModels();
});
</script>

<template>
  <div class="flex items-center gap-2">
    <Combobox
      v-model="selectedModel"
      label-position="left"
      :label="t('analytics.passportSelection')"
      :options="modelOptions"
    />
    <Select
      v-model="selectedView"
      label-position="left"
      :label="t('analytics.timeViewSelection')"
      :options="timeViewOptions"
    />
    <DatePicker
      v-if="selectedView.id === TimeView.DAYLY" v-model="selectedDate"
      show-icon date-format="dd/mm/yy" @date-select="selectRange"
    />
    <DatePicker
      v-else-if="selectedView.id === TimeView.WEEKLY"
      v-model="range"
      selection-mode="range"
      show-icon
      date-format="dd.mm.yy"
      :manual-input="false"
      placeholder="Pick a week"
      @date-select="selectRange"
    />
    <DatePicker
      v-else-if="selectedView.id === TimeView.MONTHLY"
      v-model="selectedDate" show-icon view="month" date-format="mm/yy" @date-select="selectRange"
    />
    <DatePicker
      v-else-if="selectedView.id === TimeView.YEARLY"
      v-model="selectedDate" show-icon view="year" date-format="yy" @date-select="selectRange"
    />
    <BaseButton variant="primary" :disabled="!isQueryValid" @click="applyQuery">
      {{ t('analytics.startAnalysis') }}
    </BaseButton>
  </div>
</template>
