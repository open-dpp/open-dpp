<script lang="ts" setup>
import {
  type BulkImportRunDto,
  type BulkImportRunItemPaginationDto,
  type PagingParamsDto,
  BulkImportRunStatusDto,
} from "@open-dpp/dto";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useIndexStore } from "../../stores";
import { useBulkImportRunRepo } from "../../composables/bulk-import/bulk-import-run.repo.ts";
import { usePagination } from "../../composables/pagination.ts";
import ContentViewWrapper from "../ContentViewWrapper.vue";
import TablePagination from "../../components/pagination/TablePagination.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const indexStore = useIndexStore();
const runRepo = useBulkImportRunRepo();

const runId = computed(() => String(route.params.runId));
const selectedRun = ref<BulkImportRunDto>();
const runItemsPagination = ref<BulkImportRunItemPaginationDto>();

const {
  currentPage,
  hasNext,
  previousPage,
  nextPage,
  hasPrevious,
  resetCursor,
  reloadCurrentPage,
} = usePagination({
  limit: 100,
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  fetchCallback: async (params: PagingParamsDto) => {
    const result = await runRepo.fetchRunItems(runId.value, params);
    if (!result) throw new Error(t("integrations.bulkImport.errorLoadRunItems"));
    runItemsPagination.value = result;
    return result;
  },
  changeQueryParams: (params: Record<string, string | undefined>) => {
    router.replace({ query: params });
  },
});

const runItems = computed(() => runItemsPagination.value?.result ?? []);

function statusSeverity(status: string): string {
  switch (status) {
    case "completed":
      return "success";
    case "completed_with_errors":
      return "warn";
    case "interrupted":
      return "danger";
    default:
      return "info";
  }
}

function itemStatusSeverity(status: string): string {
  switch (status) {
    case "created":
    case "updated":
      return "success";
    case "failed":
      return "danger";
    default:
      return "info";
  }
}

function passportLink(passportId: string): string {
  return `/organizations/${indexStore.selectedOrganization}/passports/${passportId}`;
}

const canInterrupt = computed(() => {
  if (!selectedRun.value) return false;
  return (
    selectedRun.value.status === BulkImportRunStatusDto.Pending ||
    selectedRun.value.status === BulkImportRunStatusDto.Running
  );
});

const interruptTooltip = computed(() => {
  if (!selectedRun.value) return "";
  if (canInterrupt.value) return "";
  return t("integrations.bulkImport.interruptTooltip", {
    status: t(`integrations.bulkImport.status.${selectedRun.value.status}`),
  });
});

async function interrupt() {
  await runRepo.interruptRun(runId.value);
  await refresh();
}

async function refresh() {
  selectedRun.value = await runRepo.fetchRun(runId.value);
  await reloadCurrentPage();
}

onMounted(async () => {
  selectedRun.value = await runRepo.fetchRun(runId.value);
  await nextPage();
});
</script>

<template>
  <ContentViewWrapper>
    <div v-if="selectedRun" class="flex flex-col gap-3">
      <span class="text-xl font-bold">{{ t("integrations.bulkImport.runDetailTitle") }}</span>
      <div class="grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-4">
        <div class="bg-white px-4 py-6 sm:px-6 lg:px-8">
          <p class="text-sm/6 font-medium text-gray-500">
            {{ t(`integrations.bulkImport.status.label`) }}
          </p>
          <p class="mt-2 flex items-baseline gap-x-2">
            <Tag
              :severity="statusSeverity(selectedRun.status)"
              :value="t(`integrations.bulkImport.status.${selectedRun.status}`)"
            />
          </p>
        </div>
        <Stat
          :value="selectedRun.succeededCount.toFixed()"
          :label="t('integrations.bulkImport.succeeded')"
        />
        <Stat
          :value="selectedRun.failedCount.toFixed()"
          :label="t('integrations.bulkImport.failed')"
        />
        <Stat
          :value="selectedRun.totalCount.toFixed()"
          :label="t('integrations.bulkImport.total')"
        />
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <DataTable :value="runItems">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xl font-bold">{{ t("integrations.bulkImport.items") }} </span>
            </div>
            <div class="flex items-center gap-2">
              <slot name="headerActions">
                <Button
                  :label="t('integrations.bulkImport.interrupt')"
                  :disabled="!canInterrupt"
                  severity="danger"
                  @click="interrupt"
                  :tooltip="interruptTooltip"
                />
                <Button :label="t('common.refresh')" @click="refresh" />
              </slot>
            </div>
          </div>
        </template>
        <Column field="rowIndex" :header="t('integrations.bulkImport.rowIndex')" />
        <Column field="status" :header="t('common.actions')">
          <template #body="{ data }">
            <Tag
              :severity="itemStatusSeverity(data.status)"
              :value="t(`integrations.bulkImport.itemStatus.${data.status}`)"
            />
          </template>
        </Column>
        <Column :header="t('integrations.bulkImport.passport')">
          <template #body="{ data }">
            <router-link
              v-if="data.passportId"
              :to="passportLink(data.passportId)"
              class="text-primary-600 hover:text-primary-500"
            >
              {{ data.passportId }}
            </router-link>
          </template>
        </Column>
        <Column field="error" :header="t('integrations.bulkImport.error')" />
      </DataTable>
      <TablePagination
        :current-page="currentPage"
        :has-previous="hasPrevious"
        :has-next="hasNext"
        :total-count="selectedRun?.totalCount"
        @next-page="nextPage"
        @previous-page="previousPage"
        @reset-cursor="resetCursor"
      />
    </div>
  </ContentViewWrapper>
</template>
