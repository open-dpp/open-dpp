<script lang="ts" setup>
import type { FileUploadSelectEvent } from "primevue";
import type { MediaInfo } from "./MediaInfo.interface";
import { Button, FileUpload } from "primevue";
import Dialog from "primevue/dialog";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useIndexStore } from "../../stores";
import { useMediaStore } from "../../stores/media";
import { useNotificationStore } from "../../stores/notification";

import MediaGrid from "./MediaGrid.vue";

const emits = defineEmits<{
  (e: "confirm", files: Array<MediaInfo>): void;
  (e: "cancel"): void;
}>();
const open = defineModel<boolean>();
const { t } = useI18n();
const mediaStore = useMediaStore();
const notificationStore = useNotificationStore();
const indexStore = useIndexStore();

const selected = ref<Array<MediaInfo>>([]);
const selectedLocalFile = ref<File | null>(null);
const selectedFile = ref<MediaInfo | null>(null);
const uploadProgress = ref<number>(0);

async function uploadFile() {
  const organizationId = indexStore.selectedOrganization;
  if (!selectedLocalFile.value || !organizationId) {
    return;
  }
  try {
    await mediaStore.uploadMedia(
      organizationId,
      selectedLocalFile.value,
      progress => (uploadProgress.value = progress),
    );
    notificationStore.addSuccessNotification("Datei erfolgreich hochgeladen.");
    await mediaStore.fetchMediaByOrganizationId();
  }
  catch (error: unknown) {
    console.error("Fehler beim Hochladen der Datei:", error);
    notificationStore.addErrorNotification(
      "Beim Hochladen der Datei ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.",
    );
    selectedFile.value = null;
  }
  finally {
    uploadProgress.value = 0;
  }
}

async function onFileSelect(event: FileUploadSelectEvent) {
  if (event.files && event.files.length > 0) {
    selectedLocalFile.value = event.files[0] as File;
    await uploadFile();
  }
  else {
    selectedLocalFile.value = null;
  }
}

watch(
  () => open.value,
  (newVal) => {
    if (newVal) {
      selected.value = [];
      selectedFile.value = null;
      uploadProgress.value = 0;
    }
  },
);
</script>

<template>
  <Dialog
    v-model:visible="open"
    modal
    class="w-3/4"
    @mousedown.stop
  >
    <template #header>
      <span class="text-xl font-bold">{{ t("file.select") }}</span>
      <FileUpload
        mode="basic"
        :auto="true"
        accept="image/jpeg, image/png, application/pdf"
        :choose-label="t('file.upload')"
        custom-upload
        @select="onFileSelect"
      />
    </template>
    <div class="px-4 py-2 sm:px-6 sm:py-4 max-h-[60vh] overflow-y-auto">
      <MediaGrid
        :multiple="false"
        :selected="selected"
        selectable
        @update-selected-items="(items) => (selected = items)"
      />
    </div>
    <template #footer>
      <Button
        :label="t('common.abort')"
        variant="outlined"
        severity="secondary"
        @click="emits('cancel')"
      />
      <Button
        :disabled="selected.length === 0"
        type="button"
        :label="t('common.select')"
        @click="emits('confirm', selected)"
      />
    </template>
    <div class="mt-5 sm:mt-4 flex flex-row gap-2 justify-end" />
  </Dialog>
</template>
