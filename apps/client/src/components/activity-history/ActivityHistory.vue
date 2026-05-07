<script setup lang="ts">
import { useDigitalProductDocument } from "../../composables/digital-product-document.ts";
import { type DigitalProductDocumentTypeType } from "../../lib/digital-product-document.ts";
import { onMounted, ref } from "vue";
import type { ActivityDto, PagingParamsDto } from "@open-dpp/dto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import apiClient from "../../lib/api-client.ts";
import { useI18n } from "vue-i18n";
import { useActivityHistory } from "../../composables/activity-history.ts";
import { usePagination } from "../../composables/pagination.ts";
import TablePagination from "../pagination/TablePagination.vue";
import { useRoute, useRouter } from "vue-router";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
const props = defineProps<{ id: string; type: DigitalProductDocumentTypeType }>();

const { getActivities, downloadActivities } = useActivityHistory(props.type);
const activities = ref<ActivityDto[]>([]);
const { t } = useI18n();
const defaultEnd = dayjs().utc();
const defaultStart = defaultEnd.subtract(1, "month");
const period = ref<Date[] | (Date | null)[]>([defaultStart.toDate(), defaultEnd.toDate()]);
const router = useRouter();

const route = useRoute();

function changeQueryParams(newQuery: Record<string, string | undefined>) {
  router.replace({
    query: {
      ...route.query,
      ...newQuery,
    },
  });
}

async function fetchCallback(pagingParams: PagingParamsDto) {
  const response = await getActivities(props.id, {
    period: {
      startDate: period.value[0]?.toISOString(),
      endDate: period.value[1]?.toISOString(),
    },
    pagination: pagingParams,
  });
  activities.value = response.result;
  return response;
}

const {
  hasPrevious,
  hasNext,
  currentPage,
  previousPage,
  resetCursor,
  nextPage,
  reloadCurrentPage,
} = usePagination({
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  limit: 10,
  fetchCallback,
  changeQueryParams,
});

const downloadZip = async () => {
  await downloadActivities(props.id, {
    startDate: period.value[0]?.toISOString(),
    endDate: period.value[1]?.toISOString(),
  });
};

const downloadJson = (activityDto: ActivityDto) => {
  const dataStr = JSON.stringify(activityDto.payload, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${dayjs(activityDto.header.createdAt).format("LLL")}_${activityDto.header.aggregateId}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

async function onPeriodChange(newPeriod: Date | Date[] | (Date | null)[] | null | undefined) {
  if (Array.isArray(newPeriod)) {
    period.value = newPeriod;
    await resetCursor();
  }
}

onMounted(async () => {
  await nextPage();
});
</script>

<template>
  <DataTable
    :value="activities"
    tableStyle="min-width: 50rem"
    paginator
    :rows="10"
    :rows-per-page-options="[10]"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-4">
          <span class="text-xl font-bold">{{ t("activityHistory.label") }}</span>
          <DatePicker
            v-model:model-value="period"
            selectionMode="range"
            :manualInput="false"
            @update:model-value="onPeriodChange"
          />
        </div>
        <Button icon="pi pi-download" :label="t('common.download')" raised @click="downloadZip" />
      </div>
    </template>
    <Column
      field="header.createdAt"
      filterField="header.createdAt"
      :header="t('activityHistory.createdAt')"
    >
      <template #body="slotProps">
        <p>
          {{ dayjs(slotProps.data.header.createdAt).format("LLL") }}
        </p>
      </template>
    </Column>
    <Column>
      <template #body="{ data }">
        <Button label="Download" @click="downloadJson(data)" />
      </template>
    </Column>
    <template #paginatorcontainer>
      <TablePagination
        :current-page="currentPage"
        :has-previous="hasPrevious"
        :has-next="hasNext"
        @reset-cursor="resetCursor"
        @previous-page="previousPage"
        @next-page="nextPage"
      />
    </template>
  </DataTable>
</template>
