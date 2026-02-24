<script lang="ts" setup>
import type { SharedDppDto } from "@open-dpp/dto";
import type { Page } from "../composables/pagination.ts";
import { AxiosError } from "axios";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";
import { Button, Column, DataTable } from "primevue";
import { useToast } from "primevue/usetoast";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import axiosIns from "../lib/axios.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import TablePagination from "./pagination/TablePagination.vue";

const props = defineProps<{
  title: string;
  items: SharedDppDto[];
  loading: boolean;
  currentPage: Page;
  hasPrevious: boolean;
  hasNext: boolean;
  usesTemplates?: boolean;
}>();

const emits = defineEmits<{
  (e: "create"): Promise<void>;
  (e: "nextPage"): Promise<void>;
  (e: "previousPage"): Promise<void>;
  (e: "resetCursor"): Promise<void>;
}>();

dayjs.extend(utc);
dayjs.extend(localizedFormat);

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();
const errorHandlingStore = useErrorHandlingStore();

async function editItem(item: SharedDppDto) {
  await router.push(`${route.path}/${item.id}`);
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
  const { data } = await axiosIns.get<{ uuid: string }>(`/passports/${item.id}/unique-product-identifier`);
  return data.uuid;
}

async function forwardToPresentation(item: SharedDppDto) {
  try {
    const uuid = await resolvePassportUuid(item);
    await router.push(`/presentation/${uuid}`);
  }
  catch (e) {
    errorHandlingStore.logErrorWithNotification(forwardToPresentationErrorMessage(e), e);
  }
}

async function forwardToPresentationChat(item: SharedDppDto) {
  try {
    const uuid = await resolvePassportUuid(item);
    await router.push(`/presentation/${uuid}/chat`);
  }
  catch (e) {
    errorHandlingStore.logErrorWithNotification(forwardToPresentationErrorMessage(e), e);
  }
}

const fileInput = ref<HTMLInputElement | null>(null);

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
    toast.add({ severity: "error", summary: t("notifications.error"), detail: t("common.exportFailed"), life: 5000 });
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
    emits("resetCursor");
    toast.add({ severity: "success", summary: t("notifications.success"), detail: t("common.importSuccess"), life: 5000 });
  }
  catch (error) {
    console.error("Failed to import passport", error);
    toast.add({ severity: "error", summary: t("notifications.error"), detail: t("common.importFailed"), life: 5000 });
  }
  finally {
    if (fileInput.value)
      fileInput.value.value = "";
  }
}
</script>

<template>
  <DataTable
    :value="props.items" :loading="props.loading" table-style="min-width: 50rem"
    paginator :rows="10" :rows-per-page-options="[10]"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{ props.title }}</span>
        <div class="flex items-center gap-2">
          <Button :label="t('common.add')" @click="emits('create')" />
          <Button v-if="!props.usesTemplates" :label="t('common.import')" @click="triggerImport" />
          <input
            v-if="!props.usesTemplates"
            ref="fileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleFileUpload"
          >
        </div>
      </div>
    </template>
    <Column field="id" header="Id" />
    <Column :header="t('templates.createdAt')">
      <template #body="slotProps">
        <p>
          {{ dayjs(slotProps.data.createdAt).format('LLL') }}
        </p>
      </template>
    </Column>
    <Column :header="t('templates.updatedAt')">
      <template #body="slotProps">
        <p>
          {{ dayjs(slotProps.data.updatedAt).format('LLL') }}
        </p>
      </template>
    </Column>
    <Column>
      <template #body="{ data }">
        <div class="flex w-full justify-end gap-2">
          <div class="flex items-center rounded-md gap-2">
            <Button
              icon="pi pi-pencil"
              severity="primary"
              :aria-label="t('common.edit')"
              :title="t('common.edit')"
              @click="editItem(data)"
            />
          </div>
          <div v-if="!props.usesTemplates" class="flex items-center rounded-md gap-2">
            <Button
              icon="pi pi-qrcode"
              severity="primary"
              :aria-label="t('dpp.forwardToPresentation')"
              :title="t('dpp.forwardToPresentation')"
              @click="forwardToPresentation(data)"
            />
          </div>
          <div v-if="!props.usesTemplates" class="flex items-center rounded-md gap-2">
            <Button
              icon="pi pi-comments"
              severity="primary"
              :aria-label="t('dpp.openPresentationChat')"
              :title="t('dpp.openPresentationChat')"
              @click="forwardToPresentationChat(data)"
            />
          </div>
          <div v-if="!props.usesTemplates" class="flex items-center rounded-md gap-2">
            <Button
              icon="pi pi-download"
              severity="secondary"
              :aria-label="t('common.exportPassport')"
              :title="t('common.exportPassport')"
              @click="exportPassport(data.id)"
            />
          </div>
        </div>
      </template>
    </Column>
    <template #paginatorcontainer>
      <TablePagination
        :current-page="props.currentPage"
        :has-previous="props.hasPrevious"
        :has-next="props.hasNext"
        @reset-cursor="emits('resetCursor')"
        @previous-page="emits('previousPage')"
        @next-page="emits('nextPage')"
      />
    </template>
  </DataTable>
</template>
