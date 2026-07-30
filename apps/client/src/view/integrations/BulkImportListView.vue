<script lang="ts" setup>
import type { BulkImportConfigDto, BulkImportRunDto } from "@open-dpp/dto";
import { onMounted, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import BulkImportWizard from "../../components/bulk-import/BulkImportWizard.vue";
import EditConfigDialog from "../../components/bulk-import/EditConfigDialog.vue";
import { useBulkImportConfigRepo } from "../../composables/bulk-import/bulk-import-config.repo.ts";
import { useBulkImportRunRepo } from "../../composables/bulk-import/bulk-import-run.repo.ts";

const { t } = useI18n();
const router = useRouter();
const configRepo = useBulkImportConfigRepo();
const runRepo = useBulkImportRunRepo();
const wizard = useTemplateRef<InstanceType<typeof BulkImportWizard> | null>("wizard");
const editDialog = useTemplateRef<InstanceType<typeof EditConfigDialog> | null>("editDialog");

const loading = ref(false);
const checkingEditability = ref<Record<string, boolean>>({});
const editableConfigs = ref<Record<string, boolean>>({});
const expandedRows = ref<Record<string, boolean>>({});
const expandedConfigId = ref<string | null>(null);
const configs = ref<BulkImportConfigDto[]>([]);
const configRuns = ref<BulkImportRunDto[]>([]);

function openWizard(config?: BulkImportConfigDto) {
  wizard.value?.open(config);
}

async function onWizardRunTriggered(runId: string) {
  await router.push({ name: "bulkImportRun", params: { runId } });
}

async function checkConfigEditability(configId: string): Promise<boolean> {
  if (editableConfigs.value[configId] !== undefined) {
    return editableConfigs.value[configId];
  }
  checkingEditability.value[configId] = true;
  try {
    const isEditable = await runRepo.isConfigEditable(configId);
    editableConfigs.value[configId] = isEditable;
    return isEditable;
  } finally {
    checkingEditability.value[configId] = false;
  }
}

async function onRowExpand(event: { data: BulkImportConfigDto }) {
  expandedRows.value = { [event.data.id]: true };
  expandedConfigId.value = event.data.id;
  const runs = await runRepo.fetchRunsForConfig(event.data.id);
  if (runs) configRuns.value = runs;
}

function onRowCollapse() {
  expandedRows.value = {};
  expandedConfigId.value = null;
}

async function onDelete(config: BulkImportConfigDto) {
  await configRepo.deleteConfig(config.id);
  configs.value = configs.value.filter((c) => c.id !== config.id);
  if (expandedConfigId.value === config.id) {
    onRowCollapse();
  }
}

function onEditConfig(config: BulkImportConfigDto) {
  editDialog.value?.open(config);
}

function onConfigSaved(updatedConfig: BulkImportConfigDto) {
  const index = configs.value.findIndex((c) => c.id === updatedConfig.id);
  if (index !== -1) {
    configs.value[index] = updatedConfig;
  }
  // If the expanded row is the edited config, refresh the runs
  if (expandedConfigId.value === updatedConfig.id) {
    onRowExpand({ data: updatedConfig });
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
  const fetchedConfigs = await configRepo.fetchConfigs();
  if (fetchedConfigs) configs.value = fetchedConfigs;
  loading.value = false;
  // Pre-check editability for all configs
  for (const config of configs.value) {
    void checkConfigEditability(config.id);
  }
});
</script>

<template>
  <DataTable
    v-model:expanded-rows="expandedRows"
    :value="configs"
    data-key="id"
    :loading="loading"
    @row-expand="onRowExpand"
    @row-collapse="onRowCollapse"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{ t("integrations.bulkImport.label") }}</span>
        <Button :label="t('integrations.bulkImport.newConfig')" @click="openWizard()" />
      </div>
    </template>
    <Column expander style="width: 3rem" />
    <Column field="name" :header="t('common.name')" />
    <Column field="templateId" :header="t('integrations.bulkImport.template')" />
    <Column field="idField" :header="t('integrations.bulkImport.idField')" />
    <Column :header="t('common.actions')">
      <template #body="{ data }">
        <Button
          icon="pi pi-pencil"
          text
          :aria-label="t('common.edit')"
          :title="t('common.edit')"
          :disabled="checkingEditability[data.id] || editableConfigs[data.id] === false"
          @click="onEditConfig(data)"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          :aria-label="t('integrations.bulkImport.delete')"
          :title="
            editableConfigs[data.id] === false
              ? t('integrations.bulkImport.configLockedTooltip')
              : t('integrations.bulkImport.delete')
          "
          :disabled="checkingEditability[data.id] || editableConfigs[data.id] === false"
          @click="onDelete(data)"
        />
      </template>
    </Column>
    <template #expansion="{ data }">
      <div class="p-4">
        <h3 class="mb-2 font-semibold">{{ t("integrations.bulkImport.runHistory") }}</h3>
        <DataTable
          v-if="configRuns.length > 0"
          :value="data.id === expandedConfigId ? configRuns : []"
          data-key="id"
        >
          <Column field="createdAt" :header="t('integrations.bulkImport.createdAt')">
            <template #body="{ data: run }">{{
              new Date(run.createdAt).toLocaleString()
            }}</template>
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
  <EditConfigDialog ref="editDialog" @saved="onConfigSaved" />
</template>
