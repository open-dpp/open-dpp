<script setup lang="ts">
import type { PassportDto } from "@open-dpp/dto";
import { MeasurementType } from "@open-dpp/api-client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DatePicker, Select } from "primevue";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod/v4";
import { VIEW_ROOT_URL } from "../../const";
import { getNowInCurrentTimezone } from "../../lib/time.ts";
import { TimeView, useAnalyticsStore } from "../../stores/analytics";
import BaseButton from "../basics/BaseButton.vue";
import LazyPassportSelect from "../passport/LazyPassportSelect.vue";

dayjs.extend(utc);

const { t } = useI18n();
const analyticsStore = useAnalyticsStore();

const timeViewOptions = Object.values(TimeView).map(value => ({
  id: value,
  label: t(`analytics.${value}`),
}));

const selectedDate = ref<Date>();
const range = ref<Date[]>();
const selectedView = ref<string>(timeViewOptions[0]!.id);

const selectedPassport = ref<PassportDto | undefined>(undefined);

const isQueryValid = computed(() => {
  return (
    selectedPassport.value
    && selectedView.value
    && range.value
    && range.value.length === 2
  );
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
  range.value = [
    currentDate.startOf(unit).toDate(),
    currentDate.endOf(unit).toDate(),
  ];
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

function getViewDomain() {
  const url = new URL(VIEW_ROOT_URL);
  return `${url.protocol}//${url.hostname}`;
}

async function applyQuery() {
  if (isQueryValid.value && selectedPassport.value) {
    const [startDate, endDate] = range.value!;
    const metricQuery = {
      startDate: startDate!,
      endDate: endDate!,
      templateId: selectedPassport.value.templateId ?? undefined,
      passportId: selectedPassport.value.id,
      valueKey: getViewDomain(),
      type: MeasurementType.PAGE_VIEWS,
      selectedView: z.enum(TimeView).parse(selectedView.value),
    };
    await analyticsStore.queryMetric(metricQuery);
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <LazyPassportSelect v-model="selectedPassport" />
    <Select
      v-model="selectedView"
      :options="timeViewOptions"
      option-value="id"
      option-label="label"
      :placeholder="t('analytics.timeViewSelection')"
      class="w-full md:w-56"
    />
    <DatePicker
      v-if="selectedView === TimeView.DAYLY"
      v-model="selectedDate"
      show-icon
      date-format="dd/mm/yy"
      @date-select="selectRange"
    />
    <DatePicker
      v-else-if="selectedView === TimeView.WEEKLY"
      v-model="range"
      selection-mode="range"
      show-icon
      date-format="dd.mm.yy"
      :manual-input="false"
      @date-select="selectRange"
    />
    <DatePicker
      v-else-if="selectedView === TimeView.MONTHLY"
      v-model="selectedDate"
      show-icon
      view="month"
      date-format="mm/yy"
      @date-select="selectRange"
    />
    <DatePicker
      v-else-if="selectedView === TimeView.YEARLY"
      v-model="selectedDate"
      show-icon
      view="year"
      date-format="yy"
      @date-select="selectRange"
    />
    <BaseButton variant="primary" :disabled="!isQueryValid" @click="applyQuery">
      {{ t("analytics.startAnalysis") }}
    </BaseButton>
  </div>
</template>
