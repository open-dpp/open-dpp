<script lang="ts" setup>
import {
  type DigitalProductDocumentStatusDtoType,
  type PagingParamsDto,
  type DigitalProductDocumentDto,
  DigitalProductDocumentStatusDto,
} from "@open-dpp/dto";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import DigitalProductDocumentTable from "../../components/digital-product-document/DigitalProductDocumentTable.vue";
import TemplateCreateDialog from "../../components/template/TemplateCreateDialog.vue";
import { useExportImport } from "../../composables/export-import.ts";
import { useTemplates } from "../../composables/templates.ts";
import apiClient from "../../lib/api-client.ts";
import { usePagination } from "../../composables/pagination.ts";
import { useDigitalProductDocumentFilter } from "../../composables/digital-product-document-filter.ts";
import DigitalProductDocumentStatusChangeMenu from "../../components/digital-product-document/DigitalProductDocumentStatusChangeMenu.vue";
import { useDigitalProductDocument } from "../../composables/digital-product-document.ts";
import { DigitalProductDocumentType } from "../../lib/digital-product-document.ts";

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

const { createTemplate, templates, loading, fetchTemplates } = useTemplates();

const { deleteDPD, publish, restore, archive } = useDigitalProductDocument(
  DigitalProductDocumentType.Template,
);

const { status, changeStatus } = useDigitalProductDocumentFilter();

function fetchCallback(pagingParams: PagingParamsDto) {
  return fetchTemplates(pagingParams, status.value ? { status: status.value } : undefined);
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

async function onDeleteButtonClicked(item: DigitalProductDocumentDto) {
  await deleteDPD(item.id, reloadCurrentPage);
}

async function onPublishButtonClicked(item: DigitalProductDocumentDto) {
  await publish(item.id);
  await reloadCurrentPage();
}

async function onArchiveButtonClicked(item: DigitalProductDocumentDto) {
  await archive(item.id);
  await reloadCurrentPage();
}

async function onRestoreButtonClicked(item: DigitalProductDocumentDto) {
  await restore(item.id);
  await reloadCurrentPage();
}

async function onSelectedStatusChange(newStatus: DigitalProductDocumentStatusDtoType | undefined) {
  await changeStatus(newStatus);
  await resetCursor();
}

onMounted(async () => {
  await nextPage();
});
</script>

<template>
  <DigitalProductDocumentTable
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
    <template #actions="{ item, goToItem }">
      <Button
        v-if="status !== DigitalProductDocumentStatusDto.Archived"
        icon="pi pi-pencil"
        severity="primary"
        :aria-label="t('common.edit')"
        :title="t('common.edit')"
        @click="goToItem(item)"
      />
      <Button
        v-if="status === DigitalProductDocumentStatusDto.Archived"
        icon="pi pi-eye"
        severity="primary"
        :aria-label="t('common.view')"
        :title="t('common.view')"
        @click="goToItem(item)"
      />
      <Button
        icon="pi pi-download"
        severity="secondary"
        :aria-label="t('common.exportTemplate')"
        :title="t('common.exportTemplate')"
        @click="exportTemplate(item.id)"
      />
      <DigitalProductDocumentStatusChangeMenu
        :item="item"
        @on-delete-clicked="onDeleteButtonClicked"
        @on-publish-clicked="onPublishButtonClicked"
        @on-archive-clicked="onArchiveButtonClicked"
        @on-restore-clicked="onRestoreButtonClicked"
      />
    </template>
  </DigitalProductDocumentTable>
  <TemplateCreateDialog
    v-if="createDialogVisible"
    v-model="createDialogVisible"
    :create-template="createTemplate"
  />
  <ConfirmDialog />
</template>
