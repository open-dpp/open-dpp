<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import DppTable from "../../components/DppTable.vue";
import TemplateCreateDialog from "../../components/template/TemplateCreateDialog.vue";
import { useExportImport } from "../../composables/export-import.ts";
import { useTemplates } from "../../composables/templates.ts";
import apiClient from "../../lib/api-client.ts";

const route = useRoute();
const router = useRouter();

function changeQueryParams(newQuery: Record<string, string | undefined>) {
  router.replace({
    query: {
      ...route.query,
      ...newQuery,
    },
  });
}

const {
  createTemplate,
  resetCursor,
  hasPrevious,
  hasNext,
  previousPage,
  nextPage,
  currentPage,
  templates,
  loading,
  init,
} = useTemplates({
  changeQueryParams,
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
});
const { t } = useI18n();

const createDialogVisible = ref(false);

const {
  importing: importingTemplate,
  exportItem: exportTemplate,
  onFileSelect: onTemplateFileSelect,
} = useExportImport({
  exportFn: async (id) => {
    const response = await apiClient.dpp.templates.export(id);
    return response.data;
  },
  importFn: async (json) => {
    const response = await apiClient.dpp.templates.import(json);
    await router.push(`${route.path}/${response.data.id}`);
  },
  filenamePrefix: "template",
  exportErrorKey: "common.templateExportFailed",
  importErrorKey: "common.templateImportFailed",
});

onMounted(async () => {
  await init();
});
</script>

<template>
  <DppTable
    key="templates-list"
    :has-previous="hasPrevious"
    :has-next="hasNext"
    :current-page="currentPage"
    :items="templates ? templates.result : []"
    :loading="loading"
    :title="t('templates.label')"
    @reset-cursor="resetCursor"
    @create="createDialogVisible = true"
    @next-page="nextPage"
    @previous-page="previousPage"
  >
    <template #headerActions>
      <Button :label="t('common.add')" @click="createDialogVisible = true" />
      <FileUpload
        mode="basic"
        :auto="true"
        accept=".json"
        :choose-label="t('common.import')"
        :disabled="importingTemplate"
        custom-upload
        @select="onTemplateFileSelect"
      />
    </template>
    <template #actions="{ passport, editItem }">
      <Button
        icon="pi pi-pencil"
        severity="primary"
        :aria-label="t('common.edit')"
        :title="t('common.edit')"
        @click="editItem(passport)"
      />
      <Button
        icon="pi pi-download"
        severity="secondary"
        :aria-label="t('common.exportTemplate')"
        :title="t('common.exportTemplate')"
        @click="exportTemplate(passport.id)"
      />
    </template>
  </DppTable>
  <TemplateCreateDialog
    v-if="createDialogVisible"
    v-model="createDialogVisible"
    :create-template="createTemplate"
  />
</template>
