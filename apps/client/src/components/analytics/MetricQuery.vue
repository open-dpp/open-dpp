<script setup lang="ts">
import type { Option } from "../../lib/combobox";
import { MeasurementType } from "@open-dpp/api-client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod/v4";
import { VIEW_ROOT_URL } from "../../const";
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

const selectedView = ref<Option>(timeViewOptions[0]!);

const dataFieldOptions = ref<Option[] | null>(null);

const modelOptions = computed(() =>
  modelStore.models.map(m => ({ label: `${m.name}`, id: m.id })),
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

function getViewDomain() {
  const url = new URL(VIEW_ROOT_URL);
  return `${url.protocol}//${url.hostname}`;
}

async function applyQuery() {
  if (isQueryValid.value) {
    const metricQuery = {
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
    <BaseButton variant="primary" :disabled="!isQueryValid" @click="applyQuery">
      {{ t('analytics.startAnalysis') }}
    </BaseButton>
  </div>
</template>
