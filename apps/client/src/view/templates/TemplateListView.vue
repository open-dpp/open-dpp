<script lang="ts" setup>
import type { DppStatusDtoType, PagingParamsDto, SharedDppDto } from "@open-dpp/dto";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import DppTable from "../../components/DppTable.vue";
import TemplateCreateDialog from "../../components/template/TemplateCreateDialog.vue";
import { useExportImport } from "../../composables/export-import.ts";
import { useTemplates } from "../../composables/templates.ts";
import apiClient from "../../lib/api-client.ts";
import { usePagination } from "../../composables/pagination.ts";
import { useDppFilter } from "../../composables/dpp-filter.ts";
import DppStatusChangeMenu from "../../components/dpp/DppStatusChangeMenu.vue";

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

const { createTemplate, templates, loading, deleteTemplate, fetchTemplates } = useTemplates();
const { status, changeStatus } = useDppFilter();

function fetchCallback(pagingParams: PagingParamsDto) {
  return fetchTemplates(pagingParams, { status: status.value });
}
const {
  resetCursor,
  hasPrevious,
  hasNext,
  previousPage,
  nextPage,
  currentPage,
  reloadCurrentPage,
} = usePagination({
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  limit: 10,
  fetchCallback,
  changeQueryParams,
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

async function onDeleteButtonClick(item: SharedDppDto) {
  await deleteTemplate(item.id, reloadCurrentPage);
}

async function onSelectedStatusChange(newStatus: DppStatusDtoType | undefined) {
  await changeStatus(newStatus);
  await resetCursor();
}

onMounted(async () => {
  await nextPage();
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
    :title="t('templates.label', 2)"
    @reset-cursor="resetCursor"
    @create="createDialogVisible = true"
    @next-page="nextPage"
    @previous-page="previousPage"
    :selected-status="status"
    @update:selected-status="onSelectedStatusChange"
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
      <DppStatusChangeMenu :item="passport" @on-delete-clicked="onDeleteButtonClick" />
    </template>
  </DppTable>
  <TemplateCreateDialog
    v-if="createDialogVisible"
    v-model="createDialogVisible"
    :create-template="createTemplate"
  />
  <ConfirmDialog />
</template>
