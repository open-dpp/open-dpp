<script lang="ts" setup>
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useIndexStore } from "../../stores";
import { useBulkImportStore } from "../../stores/bulk-import.ts";

const { t } = useI18n();
const route = useRoute();
const indexStore = useIndexStore();
const store = useBulkImportStore();

const runId = computed(() => String(route.params.runId));

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
  await store.fetchRun(runId.value);
  await store.fetchRunItems(runId.value);
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="store.selectedRun" class="flex flex-wrap items-center gap-4">
      <span class="text-xl font-bold">{{ t("integrations.bulkImport.runDetailTitle") }}</span>
      <Tag
        :severity="statusSeverity(store.selectedRun.status)"
        :value="t(`integrations.bulkImport.status.${store.selectedRun.status}`)"
      />
      <span
        >{{ t("integrations.bulkImport.succeeded") }}: {{ store.selectedRun.succeededCount }}</span
      >
      <span>{{ t("integrations.bulkImport.failed") }}: {{ store.selectedRun.failedCount }}</span>
      <span>{{ t("integrations.bulkImport.total") }}: {{ store.selectedRun.totalCount }}</span>
    </div>

    <DataTable :value="store.runItems" paginator :rows="20" :rows-per-page-options="[20, 50, 100]">
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
