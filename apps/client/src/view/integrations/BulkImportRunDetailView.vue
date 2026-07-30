<script lang="ts" setup>
import type { BulkImportRunDto, BulkImportRunItemDto } from "@open-dpp/dto";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useIndexStore } from "../../stores";
import { useBulkImportRunRepo } from "../../composables/bulk-import/bulk-import-run.repo.ts";

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
  <div class="flex flex-col gap-4">
    <div v-if="selectedRun" class="flex flex-wrap items-center gap-4">
      <span class="text-xl font-bold">{{ t("integrations.bulkImport.runDetailTitle") }}</span>
      <Tag
        :severity="statusSeverity(selectedRun.status)"
        :value="t(`integrations.bulkImport.status.${selectedRun.status}`)"
      />
      <span>{{ t("integrations.bulkImport.succeeded") }}: {{ selectedRun.succeededCount }}</span>
      <span>{{ t("integrations.bulkImport.failed") }}: {{ selectedRun.failedCount }}</span>
      <span>{{ t("integrations.bulkImport.total") }}: {{ selectedRun.totalCount }}</span>
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
  </div>
</template>
