<script lang="ts" setup>
import type { BulkImportRunDto, BulkImportRunItemDto } from "@open-dpp/dto";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useIndexStore } from "../../stores";
import { useBulkImportRunRepo } from "../../composables/bulk-import/bulk-import-run.repo.ts";
import ContentViewWrapper from "../ContentViewWrapper.vue";

const { t } = useI18n();
const route = useRoute();
const indexStore = useIndexStore();
const runRepo = useBulkImportRunRepo();

const runId = computed(() => String(route.params.runId));
const selectedRun = ref<BulkImportRunDto>();
const runItems = ref<BulkImportRunItemDto[]>([]);

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

onMounted(async () => {
  selectedRun.value = await runRepo.fetchRun(runId.value);
  const items = await runRepo.fetchRunItems(runId.value);
  if (items) runItems.value = items;
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

    <DataTable :value="runItems" paginator :rows="20" :rows-per-page-options="[20, 50, 100]">
      <template #header>
        <span class="text-xl font-bold">{{ t("integrations.bulkImport.items") }}</span>
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
  </ContentViewWrapper>
</template>
