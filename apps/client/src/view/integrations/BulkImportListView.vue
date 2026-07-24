<script lang="ts" setup>
import type { BulkImportConfigDto, BulkImportRunDto } from "@open-dpp/dto";
import { onMounted, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import BulkImportWizard from "../../components/bulk-import/BulkImportWizard.vue";
import { useBulkImportStore } from "../../stores/bulk-import.ts";

const { t } = useI18n();
const router = useRouter();
const store = useBulkImportStore();
const wizard = useTemplateRef("wizard");

const loading = ref(false);
const expandedRows = ref<Record<string, boolean>>({});
const expandedConfigId = ref<string | null>(null);

function openWizard() {
  wizard.value?.open();
}

async function onWizardRunTriggered(runId: string) {
  await router.push({ name: "bulkImportRun", params: { runId } });
}

async function onRowExpand(event: { data: BulkImportConfigDto }) {
  expandedRows.value = { [event.data.id]: true };
  expandedConfigId.value = event.data.id;
  await store.fetchRunsForConfig(event.data.id);
}

function onRowCollapse() {
  expandedRows.value = {};
  expandedConfigId.value = null;
}

async function onDelete(config: BulkImportConfigDto) {
  await store.deleteConfig(config.id);
  if (expandedConfigId.value === config.id) {
    onRowCollapse();
  }
}

function goToRun(run: BulkImportRunDto) {
  void router.push({ name: "bulkImportRun", params: { runId: run.id } });
}

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

onMounted(async () => {
  loading.value = true;
  await store.fetchConfigs();
  loading.value = false;
});
</script>

<template>
  <DataTable
    v-model:expanded-rows="expandedRows"
    :value="store.configs"
    data-key="id"
    :loading="loading"
    @row-expand="onRowExpand"
    @row-collapse="onRowCollapse"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{ t("integrations.bulkImport.label") }}</span>
        <Button :label="t('integrations.bulkImport.newConfig')" @click="openWizard" />
      </div>
    </template>
    <Column expander style="width: 3rem" />
    <Column field="name" :header="t('common.name')" />
    <Column field="templateId" :header="t('integrations.bulkImport.template')" />
    <Column field="idField" :header="t('integrations.bulkImport.idField')" />
    <Column :header="t('common.actions')">
      <template #body="{ data }">
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          :aria-label="t('integrations.bulkImport.delete')"
          :title="t('integrations.bulkImport.delete')"
          @click="onDelete(data)"
        />
      </template>
    </Column>
    <template #expansion="{ data }">
      <div class="p-4">
        <h3 class="mb-2 font-semibold">{{ t("integrations.bulkImport.runHistory") }}</h3>
        <DataTable
          v-if="store.configRuns.length > 0"
          :value="data.id === expandedConfigId ? store.configRuns : []"
          data-key="id"
        >
          <Column field="createdAt" :header="t('integrations.bulkImport.createdAt')">
            <template #body="{ data: run }">{{ new Date(run.createdAt).toLocaleString() }}</template>
          </Column>
          <Column field="status">
            <template #body="{ data: run }">
              <Tag
                :severity="statusSeverity(run.status)"
                :value="t(`integrations.bulkImport.status.${run.status}`)"
              />
            </template>
          </Column>
          <Column field="succeededCount" :header="t('integrations.bulkImport.succeeded')" />
          <Column field="failedCount" :header="t('integrations.bulkImport.failed')" />
          <Column field="totalCount" :header="t('integrations.bulkImport.total')" />
          <Column :header="t('common.actions')">
            <template #body="{ data: run }">
              <Button :label="t('common.view')" text @click="goToRun(run)" />
            </template>
          </Column>
        </DataTable>
        <span v-else class="text-surface-500 dark:text-surface-400">{{
          t("integrations.bulkImport.noRuns")
        }}</span>
      </div>
    </template>
  </DataTable>
  <BulkImportWizard ref="wizard" @run-triggered="onWizardRunTriggered" />
</template>
