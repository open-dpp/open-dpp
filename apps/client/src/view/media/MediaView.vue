<script lang="ts" setup>
import type { FileUploadSelectEvent } from "primevue";
import type { MediaInfo } from "../../components/media/MediaInfo.interface";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import MediaDetailsSidebar from "../../components/media/MediaDetailsSidebar.vue";
import MediaGrid from "../../components/media/MediaGrid.vue";
import { handleApiError, LimitError } from "../../lib/api-error-mapping";
import { useMediaStore } from "../../stores/media";
import { useNotificationStore } from "../../stores/notification";

const { t } = useI18n();
const mediaStore = useMediaStore();
const notificationStore = useNotificationStore();

const selected = ref<Array<MediaInfo>>([]);
const sidebarOpen = ref<boolean>(false);
const selectedLocalFile = ref<File | null>(null);
const selectedFile = ref<MediaInfo | null>(null);
const uploadProgress = ref<number>(0);

function updateSelected(items: Array<MediaInfo>) {
  selected.value = items;
  sidebarOpen.value = items.length === 1;
}

async function uploadFile() {
  if (!selectedLocalFile.value) {
    return;
  }
  try {
    await mediaStore.uploadMedia(
      selectedLocalFile.value,
      progress => (uploadProgress.value = progress),
    );
    notificationStore.addSuccessNotification(t("file.uploadSuccess"));
    await mediaStore.fetchMediaByOrganizationId();
  }
  catch (error: unknown) {
    const err = handleApiError(error);
    if (err instanceof LimitError) {
      notificationStore.addErrorNotification(
        t(`api.error.limit.${err.key}`, { limit: err.limit }),
      );
    }
    else {
      console.error("Fehler beim Hochladen der Datei:", error);
      notificationStore.addErrorNotification(t("file.uploadError"));
    }
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
</script>

<template>
  <MediaDetailsSidebar
    v-model="sidebarOpen"
    :media="selected[0]"
    @update:model-value="updateSelected([])"
  />
  <div class="flex flex-row gap-3 h-full w-full">
    <div class="mt-8 flex flex-col gap-10 grow">
      <div class="flex justify-end">
        <FileUpload
          mode="basic"
          :auto="true"
          accept="image/jpeg, image/png, application/pdf"
          :choose-label="t('file.upload')"
          custom-upload
          @select="onFileSelect"
        />
      </div>
      <div>
        <MediaGrid
          :multiple="false"
          :selectable="true"
          :selected="selected"
          @update-selected-items="updateSelected"
        />
      </div>
    </div>
  </div>
</template>
