<template>
  <div class="flex items-center gap-2">
    <Combobox
      v-model="selectedModel"
      label-position="left"
      :label="t('analytics.passportSelection')"
      :options="modelOptions"
    />
    <Select
      label-position="left"
      :label="t('analytics.timePeriodSelection')"
      :options="timePeriodOptions"
      v-model="selectedTimePeriod"
    />
    <BaseButton variant="primary" :disabled="!isQueryValid" @click="applyQuery"
      >Analyse starten</BaseButton
    >
  </div>
</template>
<script setup lang="ts">
import BaseButton from '../basics/BaseButton.vue';
import Combobox from '../basics/Combobox.vue';
import { computed, onMounted, ref, watch } from 'vue';
import { MeasurementType, TimePeriod } from '@open-dpp/api-client';
import { useAnalyticsStore } from '../../stores/analytics';
import { useModelsStore } from '../../stores/models';
import { Option } from '../../lib/combobox';
import { VIEW_ROOT_URL } from '../../const';
import Select from '../basics/Select.vue';
import { z } from 'zod/v4';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const modelStore = useModelsStore();
const analyticsStore = useAnalyticsStore();

const timePeriodOptions = [
  {
    id: TimePeriod.HOUR,
    label: 'Tagesansicht',
  },
  {
    id: TimePeriod.DAY,
    label: 'Wochensansicht',
  },
  {
    id: TimePeriod.WEEK,
    label: 'Monatsansicht',
  },
  {
    id: TimePeriod.MONTH,
    label: 'Jahresansicht',
  },
];

const selectedTimePeriod = ref<Option>(timePeriodOptions[0]);

const dataFieldOptions = ref<Option[] | null>(null);

const modelOptions = computed(() =>
  modelStore.models.map((m) => ({ label: `${m.name}`, id: m.id })),
);
const selectedModel = ref<Option | null>(null);
const selectedTemplate = ref<string | null>(null);

const isQueryValid = computed(() => {
  return selectedModel.value;
});

watch(
  () => selectedModel.value?.id, // The store property to watch
  async (newModelId) => {
    if (newModelId) {
      const model = await modelStore.getModelById(newModelId);
      dataFieldOptions.value = null;
      selectedTemplate.value = model.templateId;
    }
  },
  { immediate: true },
);

const getViewDomain = () => {
  const url = new URL(VIEW_ROOT_URL);
  return `${url.protocol}//${url.hostname}`;
};

const applyQuery = async () => {
  if (isQueryValid.value) {
    const metricQuery = {
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: new Date('2025-12-01T00:00:00Z'),
      templateId: selectedTemplate.value!,
      modelId: selectedModel.value!.id,
      valueKey: getViewDomain(),
      type: MeasurementType.PAGE_VIEWS,
      period: z.enum(TimePeriod).parse(selectedTimePeriod.value!.id),
    };
    await analyticsStore.queryMetric(metricQuery);
  }
};

onMounted(async () => {
  await modelStore.getModels();
});
</script>
