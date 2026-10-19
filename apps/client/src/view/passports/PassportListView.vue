<script lang="ts" setup>
import {
  type BulkImportConfigDto,
  type DigitalProductDocumentDto,
  DigitalProductDocumentStatusDto,
  type PagingParamsDto,
} from "@open-dpp/dto";
import { useToast } from "primevue/usetoast";
import { onMounted, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import BulkImportLaunchDialog from "../../components/bulk-import/BulkImportLaunchDialog.vue";
import BulkImportWizard from "../../components/bulk-import/BulkImportWizard.vue";
import DigitalProductDocumentTable from "../../components/digital-product-document/DigitalProductDocumentTable.vue";
import PassportCreateDialog from "../../components/passport/PassportCreateDialog.vue";
import PassportRegistryExportDialog from "../../components/passport/PassportRegistryExportDialog.vue";
import { useExportImport } from "../../composables/export-import";
import { usePagination } from "../../composables/pagination";
import { usePassports } from "../../composables/passports";
import axiosIns from "../../lib/axios";
import DigitalProductDocumentFilterBar from "../../components/digital-product-document/DigitalProductDocumentFilterBar.vue";
import { useDigitalProductDocumentListFilter } from "../../composables/digital-product-document-list-filter.ts";
import DigitalProductDocumentStatusChangeMenu from "../../components/digital-product-document/DigitalProductDocumentStatusChangeMenu.vue";
import { useDigitalProductDocument } from "../../composables/digital-product-document.ts";
import { DigitalProductDocumentType } from "../../lib/digital-product-document.ts";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { t } = useI18n();

function changeQueryParams(newQuery: Record<string, string | undefined>) {
  router.replace({
    query: {
      ...route.query,
      ...newQuery,
    },
  });
}

const { passports, loading, fetchPassports } = usePassports();

const { deleteDPD, publish, restore, archive } = useDigitalProductDocument(
  DigitalProductDocumentType.Passport,
);

const {
  status,
  templateIds,
  period,
  filter,
  hasActiveFilters,
  setStatus,
  setTemplateIds,
  setPeriod,
  reset,
} = useDigitalProductDocumentListFilter({ withTemplateIds: true });

function fetchCallback(pagingParams: PagingParamsDto) {
  return fetchPassports(pagingParams, filter.value);
}

const {
  hasPrevious,
  hasNext,
  currentPage,
  previousPage,
  resetCursor,
  nextPage,
  reloadCurrentPage,
  totalCount,
} = usePagination({
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  limit: 10,
  fetchCallback,
  changeQueryParams,
});

const createDialog = useTemplateRef("createDialog");
const registryExportDialog = useTemplateRef("registryExportDialog");

const {
  importing,
  exportItem: exportPassport,
  onFileSelect: onPassportFileSelect,
} = useExportImport({
  exportFn: async (id) => {
    const response = await axiosIns.get(`/passports/${id}/export`);
    return response.data;
  },
  importFn: async (json) => {
    await axiosIns.post("/passports/import", json);
    await resetCursor();
    toast.add({
      severity: "success",
      summary: t("notifications.success"),
      detail: t("common.importSuccess"),
      life: 5000,
    });
  },
  filenamePrefix: "passport",
  exportErrorKey: "common.exportFailed",
  importErrorKey: "common.importFailed",
});

function newPassport() {
  createDialog.value?.open();
}

function openRegistryExport() {
  registryExportDialog.value?.open();
}

const bulkImportLaunchDialog = useTemplateRef("bulkImportLaunchDialog");
const bulkImportWizard = useTemplateRef("bulkImportWizard");

function openBulkImportLaunch() {
  bulkImportLaunchDialog.value?.open();
}

function onUseExistingBulkImportConfig(config: BulkImportConfigDto) {
  bulkImportWizard.value?.open(config);
}

function onUseNewBulkImportConfig() {
  bulkImportWizard.value?.open();
}

async function onBulkImportRunTriggered(runId: string) {
  await router.push({ name: "bulkImportRun", params: { runId } });
}

const qrCodeDialogItem = ref<DigitalProductDocumentDto | null>(null);
const qrCodeDialogVisible = ref(false);

async function showQrCode(item: DigitalProductDocumentDto) {
  qrCodeDialogItem.value = item;
  qrCodeDialogVisible.value = true;
}

function isArchived(item: DigitalProductDocumentDto) {
  return item.lastStatusChange.currentStatus === DigitalProductDocumentStatusDto.Archived;
}

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

async function onPublishFromQrDialog() {
  if (qrCodeDialogItem.value) {
    await publish(qrCodeDialogItem.value.id);
    await reloadCurrentPage();
  }
}

async function onFilterChange(applyChange: () => Promise<void>) {
  await applyChange();
  await resetCursor();
}

onMounted(async () => {
  await nextPage();
});
</script>

<template>
  <DigitalProductDocumentTable
    key="passports-list"
    :has-previous="hasPrevious"
    :has-next="hasNext"
    :current-page="currentPage"
    :total-count="totalCount"
    :items="passports ? passports.result : []"
    :loading="loading"
    :title="t('passports.label', 2)"
    @reset-cursor="resetCursor"
    @next-page="nextPage"
    @previous-page="previousPage"
  >
    <template #filters>
      <DigitalProductDocumentFilterBar
        show-templates
        :status="status"
        :template-ids="templateIds"
        :period="period"
        :has-active-filters="hasActiveFilters"
        @update:status="(value) => onFilterChange(() => setStatus(value))"
        @update:template-ids="(value) => onFilterChange(() => setTemplateIds(value))"
        @update:period="(value) => onFilterChange(() => setPeriod(value))"
        @reset="onFilterChange(reset)"
      />
    </template>
    <template #headerActions>
      <Button :label="t('common.add')" @click="newPassport" />
      <FileUpload
        mode="basic"
        :auto="true"
        accept=".json"
        :choose-label="t('common.import')"
        :disabled="importing"
        custom-upload
        @select="onPassportFileSelect"
      />
      <Button
        :label="t('integrations.bulkImport.label')"
        severity="secondary"
        @click="openBulkImportLaunch"
      />
      <Button
        :label="t('passports.registryExport.button')"
        severity="secondary"
        data-cy="registry-export-open"
        @click="openRegistryExport"
      />
    </template>
    <template #actions="{ item, goToItem }">
      <Button
        icon="pi pi-qrcode"
        severity="info"
        :aria-label="t('common.qrCode')"
        :title="t('common.qrCode')"
        @click="showQrCode(item)"
      />
      <Button
        v-if="!isArchived(item)"
        icon="pi pi-pencil"
        severity="primary"
        :aria-label="t('common.edit')"
        :title="t('common.edit')"
        @click="goToItem(item)"
      />
      <Button
        v-if="isArchived(item)"
        icon="pi pi-eye"
        severity="primary"
        :aria-label="t('common.view')"
        :title="t('common.view')"
        @click="goToItem(item)"
      />
      <Button
        icon="pi pi-download"
        severity="secondary"
        :aria-label="t('common.exportPassport')"
        :title="t('common.exportPassport')"
        @click="exportPassport(item.id)"
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
  <PassportCreateDialog ref="createDialog" />
  <PassportRegistryExportDialog ref="registryExportDialog" />
  <BulkImportLaunchDialog
    ref="bulkImportLaunchDialog"
    @use-existing="onUseExistingBulkImportConfig"
    @use-new="onUseNewBulkImportConfig"
  />
  <BulkImportWizard ref="bulkImportWizard" @run-triggered="onBulkImportRunTriggered" />
  <PassportQrCodeDialog
    v-if="qrCodeDialogItem"
    v-model:visible="qrCodeDialogVisible"
    :passport-id="qrCodeDialogItem.id"
    :status="qrCodeDialogItem.lastStatusChange.currentStatus"
    @publish="onPublishFromQrDialog"
  />
</template>
