<template>
  <div class="flex items-center gap-2">
    <Combobox
      v-model="selectedMeasurementType"
      label-position="left"
      label="Metrik"
      :options="measurementTypeOptions"
    />
    <Combobox
      v-model="selectedModel"
      label-position="left"
      label="Modellpass"
      :options="modelOptions"
    />
    <div v-if="dataFieldOptions && dataFieldOptions.length === 0">
      Kein numerisches Feld vorhanden
    </div>
    <Combobox
      v-else-if="dataFieldOptions && dataFieldOptions.length > 0"
      v-model="selectedDataField"
      label-position="left"
      label="Datenfeld"
      :options="dataFieldOptions"
    />
    <Select
      label-position="left"
      label="Ansicht"
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
import {
  DataFieldType,
  MeasurementType,
  TimePeriod,
} from '@open-dpp/api-client';
import { useAnalyticsStore } from '../../stores/analytics';
import { useModelsStore } from '../../stores/models';
import { Option } from '../../lib/combobox';
import apiClient from '../../lib/api-client';
import { VIEW_ROOT_URL } from '../../const';
import Select from '../basics/Select.vue';
import { z } from 'zod/v4';
import { DataSection } from '../../../../src/product-passport/domain/product-passport';

const modelStore = useModelsStore();
const analyticsStore = useAnalyticsStore();

const measurementTypeOptions = [
  {
    id: MeasurementType.PAGE_VIEWS,
    label: 'Seitenaufrufe',
  },
  {
    id: MeasurementType.FIELD_AGGREGATE,
    label: 'Datenfeldwert aggregieren',
  },
];
const selectedMeasurementType = ref<Option | null>(null);

const timePeriodOptions = [
  {
    id: TimePeriod.DAY,
    label: 'Tagesansicht',
  },
  {
    id: TimePeriod.WEEK,
    label: 'Wochensansicht',
  },
  {
    id: TimePeriod.MONTH,
    label: 'Monatsansicht',
  },
  {
    id: TimePeriod.YEAR,
    label: 'Jahresansicht',
  },
];

const selectedTimePeriod = ref<Option>(timePeriodOptions[0]);

const dataFieldOptions = ref<Option[] | null>(null);

const modelOptions = computed(() =>
  modelStore.models.map((m) => ({ label: `${m.name}`, id: m.id })),
);
const selectedModel = ref<Option | null>(null);

const selectedDataField = ref<Option | null>(null);

const isQueryValid = computed(() => {
  if (!selectedMeasurementType.value || !selectedModel.value) return false;

  if (selectedMeasurementType.value.id === MeasurementType.FIELD_AGGREGATE) {
    return !!selectedDataField.value;
  }

  return true;
});

watch(
  [() => selectedMeasurementType.value?.id, () => selectedModel.value?.id], // The store property to watch
  async ([newType, newModelId]) => {
    if (newType === MeasurementType.FIELD_AGGREGATE && newModelId) {
      const model = await modelStore.getModelById(newModelId);
      const response = await apiClient.dpp.templates.getById(model.templateId);
      dataFieldOptions.value = response.data.sections
        .map((s: DataSection) =>
          s.dataFields
            .filter((d) => d.type === DataFieldType.NUMERIC_FIELD)
            .map((f) => ({ label: f.name, id: f.id })),
        )
        .flat();
      selectedDataField.value = null;
    } else {
      dataFieldOptions.value = null;
    }
  },
  { immediate: true },
);

const applyQuery = async () => {
  if (isQueryValid.value) {
    const metricQuery = {
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: new Date('2025-12-01T00:00:00Z'),
      templateId: 'c58122ed-962f-48e7-8727-fecae253a270',
      modelId: selectedModel.value!.id,
      valueKey:
        selectedMeasurementType.value!.id === MeasurementType.PAGE_VIEWS
          ? VIEW_ROOT_URL
          : selectedDataField.value!.id,
      type: z.enum(MeasurementType).parse(selectedMeasurementType.value!.id),
      period: z.enum(TimePeriod).parse(selectedTimePeriod.value.id),
    };
    await analyticsStore.queryMetric(metricQuery);
  }
};

onMounted(async () => {
  await modelStore.getModels();
});
</script>
