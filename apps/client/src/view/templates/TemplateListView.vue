<script lang="ts" setup>
import { Button, useToast } from "primevue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import DppTable from "../../components/DppTable.vue";
import TemplateCreateDialog from "../../components/template/TemplateCreateDialog.vue";
import { useTemplates } from "../../composables/templates.ts";
import apiClient from "../../lib/api-client.ts";
import axiosIns from "../../lib/axios.ts";

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
const toast = useToast();

const createDialogVisible = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const templateFileInput = ref<HTMLInputElement | null>(null);
const importingTemplate = ref<boolean>(false);

async function exportTemplate(id: string) {
  let url: string | undefined;
  try {
    const response = await apiClient.dpp.templates.export(id);
    const dataStr = JSON.stringify(response.data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `template-${id}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  catch (error) {
    console.error("Failed to export template", error);
    toast.add({ severity: "error", summary: t("notifications.error"), detail: t("common.templateExportFailed"), life: 5000 });
  }
  finally {
    if (url) {
      globalThis.URL.revokeObjectURL(url);
    }
  }
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file)
    return;

  try {
    const json = JSON.parse(await file.text());
    await axiosIns.post("/templates/import", json);
    // emits("resetCursor");
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

function triggerTemplateImport() {
  templateFileInput.value?.click();
}

async function handleTemplateFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file)
    return;

  importingTemplate.value = true;
  try {
    const json = JSON.parse(await file.text());
    const response = await apiClient.dpp.templates.import(json);
    await router.push(`${route.path}/${response.data.id}`);
  }
  catch (error) {
    console.error("Failed to import template", error);
    toast.add({ severity: "error", summary: t("notifications.error"), detail: t("common.templateImportFailed"), life: 5000 });
  }
  finally {
    if (templateFileInput.value)
      templateFileInput.value.value = "";
    importingTemplate.value = false;
  }
}

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
      <Button :label="t('common.import')" :disabled="importingTemplate" @click="triggerTemplateImport" />
      <input
        ref="templateFileInput"
        type="file"
        accept=".json"
        class="hidden"
        @change="handleTemplateFileUpload"
      >
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
  <TemplateCreateDialog v-if="createDialogVisible" v-model="createDialogVisible" :create-template="createTemplate" />
</template>
