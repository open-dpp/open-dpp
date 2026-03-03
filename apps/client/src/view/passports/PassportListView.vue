<script lang="ts" setup>
import type { SharedDppDto } from "@open-dpp/dto";
import { AxiosError } from "axios";
import { Button, useToast } from "primevue";
import { onMounted, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import DppTable from "../../components/DppTable.vue";
import PassportCreateDialog from "../../components/passport/PassportCreateDialog.vue";
import { usePagination } from "../../composables/pagination";
import { usePassports } from "../../composables/passports";
import axiosIns from "../../lib/axios";
import { useErrorHandlingStore } from "../../stores/error.handling";

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

const { passports, loading, fetchPassports } = usePassports();

const {
  hasPrevious,
  hasNext,
  currentPage,
  previousPage,
  resetCursor,
  nextPage,
} = usePagination({
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  limit: 10,
  fetchCallback: fetchPassports,
  changeQueryParams,
});

const toast = useToast();

const { t } = useI18n();
const createDialog = useTemplateRef("createDialog");
const fileInput = useTemplateRef("fileInput");

const errorHandlingStore = useErrorHandlingStore();

function newPassport() {
  createDialog.value?.open();
}

async function routeToQrCode(id: string) {
  await router.push(`${route.path}/${id}/qr-code`);
}

function forwardToPresentationErrorMessage(e: unknown): string {
  if (e instanceof AxiosError) {
    if (!e.response)
      return t("dpp.forwardToPresentationErrorNetwork");
    if (e.response.status === 404)
      return t("dpp.forwardToPresentationError404");
    if (e.response.status === 403)
      return t("dpp.forwardToPresentationError403");
  }
  return t("dpp.forwardToPresentationError");
}

async function resolvePassportUuid(item: SharedDppDto): Promise<string> {
  const { data } = await axiosIns.get<{ uuid: string }>(
    `/passports/${item.id}/unique-product-identifier`,
  );
  return data.uuid;
}

async function forwardToPresentationChat(item: SharedDppDto) {
  try {
    const uuid = await resolvePassportUuid(item);
    await router.push(`/presentation/${uuid}/chat`);
  }
  catch (e) {
    errorHandlingStore.logErrorWithNotification(
      forwardToPresentationErrorMessage(e),
      e,
    );
  }
}

async function exportPassport(id: string) {
  let url: string | undefined;
  try {
    const response = await axiosIns.get(`/passports/${id}/export`);
    const data = JSON.stringify(response.data, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `passport-${id}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  catch (error) {
    console.error("Failed to export passport", error);
    toast.add({
      severity: "error",
      summary: t("notifications.error"),
      detail: t("common.exportFailed"),
      life: 5000,
    });
  }
  finally {
    if (url) {
      globalThis.URL.revokeObjectURL(url);
    }
  }
}

function triggerImport() {
  fileInput.value?.click();
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file)
    return;

  try {
    const json = JSON.parse(await file.text());
    await axiosIns.post("/passports/import", json);
    resetCursor();
    toast.add({
      severity: "success",
      summary: t("notifications.success"),
      detail: t("common.importSuccess"),
      life: 5000,
    });
  }
  catch (error) {
    console.error("Failed to import passport", error);
    toast.add({
      severity: "error",
      summary: t("notifications.error"),
      detail: t("common.importFailed"),
      life: 5000,
    });
  }
  finally {
    if (fileInput.value)
      fileInput.value.value = "";
  }
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
    :items="passports ? passports.result : []"
    :loading="loading"
    :title="t('passports.label', 2)"
    @reset-cursor="resetCursor"
    @next-page="nextPage"
    @previous-page="previousPage"
  >
    <template #headerActions>
      <Button :label="t('common.add')" @click="newPassport" />
      <Button
        :label="t('common.import')"
        @click="triggerImport"
      />
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        class="hidden"
        @change="handleFileUpload"
      >
    </template>
    <template #actions="{ passport, editItem }">
      <Button
        icon="pi pi-qrcode"
        severity="info"
        :aria-label="t('common.qrCode')"
        :title="t('common.qrCode')"
        @click="routeToQrCode(passport.id)"
      />
      <Button
        icon="pi pi-pencil"
        severity="primary"
        :aria-label="t('common.edit')"
        :title="t('common.edit')"
        @click="editItem(passport)"
      />
      <Button
        icon="pi pi-comments"
        severity="primary"
        :aria-label="t('dpp.openPresentationChat')"
        :title="t('dpp.openPresentationChat')"
        @click="forwardToPresentationChat(passport)"
      />
      <Button
        icon="pi pi-download"
        severity="secondary"
        :aria-label="t('common.exportPassport')"
        :title="t('common.exportPassport')"
        @click="exportPassport(passport.id)"
      />
    </template>
  </DppTable>
  <PassportCreateDialog ref="createDialog" />
</template>
