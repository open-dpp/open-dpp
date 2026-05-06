<script lang="ts" setup>
import {
  type DigitalProductDocumentStatusDtoType,
  type PagingParamsDto,
  type DigitalProductDocumentDto,
  DigitalProductDocumentStatusDto,
} from "@open-dpp/dto";
import { AxiosError } from "axios";
import { useToast } from "primevue/usetoast";
import { onMounted, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import DigitalProductDocumentTable from "../../components/digital-product-document/DigitalProductDocumentTable.vue";
import PassportCreateDialog from "../../components/passport/PassportCreateDialog.vue";
import { useExportImport } from "../../composables/export-import";
import { usePagination } from "../../composables/pagination";
import { usePassports } from "../../composables/passports";
import axiosIns from "../../lib/axios";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { useDigitalProductDocumentFilter } from "../../composables/digital-product-document-filter.ts";
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

const { status, changeStatus } = useDigitalProductDocumentFilter();

function fetchCallback(pagingParams: PagingParamsDto) {
  return fetchPassports(pagingParams, status.value ? { status: [status.value] } : undefined);
}

const {
  hasPrevious,
  hasNext,
  currentPage,
  previousPage,
  resetCursor,
  nextPage,
  reloadCurrentPage,
} = usePagination({
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  limit: 10,
  fetchCallback,
  changeQueryParams,
});

const createDialog = useTemplateRef("createDialog");

const errorHandlingStore = useErrorHandlingStore();

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

const qrCodeDialogItem = ref<DigitalProductDocumentDto | null>(null);
const qrCodeDialogVisible = ref(false);

async function showQrCode(item: DigitalProductDocumentDto) {
  qrCodeDialogItem.value = item;
  qrCodeDialogVisible.value = true;
}

function forwardToPresentationErrorMessage(e: unknown): string {
  if (e instanceof AxiosError) {
    if (!e.response) return t("dpp.forwardToPresentationErrorNetwork");
    if (e.response.status === 404) return t("dpp.forwardToPresentationError404");
    if (e.response.status === 403) return t("dpp.forwardToPresentationError403");
  }
  return t("dpp.forwardToPresentationError");
}

async function resolvePassportUuid(item: DigitalProductDocumentDto): Promise<string> {
  const { data } = await axiosIns.get<{ uuid: string }>(
    `/passports/${item.id}/unique-product-identifier`,
  );
  return data.uuid;
}

async function forwardToPresentationChat(item: DigitalProductDocumentDto) {
  try {
    const uuid = await resolvePassportUuid(item);
    await router.push(`/presentation/${uuid}/chat`);
  } catch (e) {
    errorHandlingStore.logErrorWithNotification(forwardToPresentationErrorMessage(e), e);
  }
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
    :items="passports ? passports.result : []"
    :loading="loading"
    :title="t('passports.label', 2)"
    @reset-cursor="resetCursor"
    @next-page="nextPage"
    @previous-page="previousPage"
    :selected-status="status"
    @update:selected-status="onSelectedStatusChange"
  >
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
  <PassportQrCodeDialog
    v-if="qrCodeDialogItem"
    v-model="qrCodeDialogVisible"
    :passport-id="qrCodeDialogItem.id"
  />
</template>
