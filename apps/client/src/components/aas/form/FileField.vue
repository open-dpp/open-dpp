<script lang="ts" setup>
import type { MediaInfo } from "../../media/MediaInfo.interface.ts";
import { DocumentIcon, PencilIcon } from "@heroicons/vue/16/solid";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useIndexStore } from "../../../stores";
import { useMediaStore } from "../../../stores/media.ts";
import { useNotificationStore } from "../../../stores/notification.ts";
import { usePassportFormStore } from "../../../stores/passport.form.ts";
import MediaModal from "../../media/MediaModal.vue";
import MediaPreview from "../../media/MediaPreview.vue";

const props = defineProps<{
  id: string;
  label: string;
  modelValue?: string | null;
}>();

const emits = defineEmits<{
  (e: "clicked"): void;
  (e: "update:modelValue", value: string | undefined | null): void;
  (e: "changeContentType", value: string | undefined | null): void;
}>();
const { t } = useI18n();
const passportFormStore = usePassportFormStore();
const indexStore = useIndexStore();
const notificationStore = useNotificationStore();
const mediaStore = useMediaStore();

const fileInput = ref<HTMLInputElement>();
const selectedLocalFile = ref<File | null>(null);
const selectedFile = ref<MediaInfo | null>(null);
const uploadedMedia = ref<MediaInfo | null>(null);
const uploadProgress = ref<number>(0);
const uploadedMediaId = ref<string | undefined | null>(props.modelValue);
const uploadedFileUrl = ref<string | undefined | null>(undefined);
const openFileModal = ref<boolean>(false);

watch(() => props.modelValue, (newVal) => {
  if (newVal !== uploadedMediaId.value) {
    uploadedMediaId.value = newVal;
    if (newVal) {
      loadFile();
    }
  }
});

watch(uploadedMediaId, (newVal) => {
  emits("update:modelValue", newVal);
});

const isImage = computed(() => {
  if (!selectedLocalFile.value) {
    return false;
  }
  return selectedLocalFile.value.type.startsWith("image/");
});

const fileUrl = computed(() => {
  if (!selectedLocalFile.value) {
    return null;
  }
  return URL.createObjectURL(selectedLocalFile.value);
});

const selectedFileSizeKB = computed(() => {
  const size = selectedLocalFile.value?.size;
  if (typeof size !== "number") {
    return null;
  }
  return (size / 1024).toFixed(1);
});

function openFileInput() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

function selectFile(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedLocalFile.value = target.files[0] as File;
  }
  else {
    selectedLocalFile.value = null;
  }
}

async function uploadFile() {
  if (!selectedLocalFile.value) {
    return;
  }
  try {
    uploadedMediaId.value = await mediaStore.uploadDppMedia(
      indexStore.selectedOrganization,
      passportFormStore.getUUID(),
      props.id,
      selectedLocalFile.value,
      (progress: number) => (uploadProgress.value = progress),
    );
    notificationStore.addSuccessNotification(
      t("models.form.file.uploadSuccess"),
    );
    selectedLocalFile.value = null;
    await loadFile();
  }
  catch (error: unknown) {
    console.error("Fehler beim Hochladen der Datei:", error);
    uploadedMediaId.value = undefined;
    notificationStore.addErrorNotification(t("models.form.file.uploadError"));
    selectedFile.value = null;
  }
  finally {
    uploadProgress.value = 0;
  }
}

async function loadFile() {
  if (!uploadedMediaId.value) {
    return;
  }

  try {
    const { blob, mediaInfo } = await mediaStore.fetchMedia(
      uploadedMediaId.value,
    );

    // Revoke an old object URL to avoid memory leaks before assigning a new one
    if (uploadedFileUrl.value) {
      try {
        URL.revokeObjectURL(uploadedFileUrl.value);
      }
      catch (revokeErr) {
        console.error(
          "Fehler beim Freigeben der vorherigen Objekt-URL:",
          revokeErr,
        );
      }
    }

    if (blob) {
      uploadedFileUrl.value = URL.createObjectURL(blob);
    }
    uploadedMedia.value = mediaInfo;
    emits("changeContentType", uploadedMedia.value.mimeType);
  }
  catch (error) {
    console.error("Fehler beim Laden der Datei:", error);
    // Reset state on failure
    if (uploadedFileUrl.value) {
      try {
        URL.revokeObjectURL(uploadedFileUrl.value);
      }
      catch (revokeErr) {
        console.error(
          "Fehler beim Freigeben der Objekt-URL nach Fehler:",
          revokeErr,
        );
      }
    }
    uploadedFileUrl.value = undefined;
    uploadedMedia.value = null;

    // Notify user via the existing notification store if available
    try {
      notificationStore.addErrorNotification(
        t("models.form.file.downloadError"),
      );
    }
    catch {
      // Fallback to console if the notification store is not available for any reason
      console.error(
        "Benachrichtigung über Ladefehler konnte nicht angezeigt werden.",
      );
    }
    // We intentionally do not rethrow to keep caller logic simple unless needed.
  }
}

async function updateFileFromModal(items: Array<MediaInfo>) {
  if (items.length === 0) {
    openFileModal.value = false;
    return;
  }
  if (items.length > 0) {
    uploadedMediaId.value = (items[0] as MediaInfo).id;
    openFileModal.value = false;
    await loadFile();
  }
}

onMounted(async () => {
  await loadFile();
});

onUnmounted(() => {
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value);
  }
});
</script>

<template>
  <div
    class="group grow min-w-0 text-base mb-4"
    style="position: relative"
  >
    <div
      class="mb-1.5 flex flex-col items-start justify-start last:mb-0"
    >
      <label
        class="block text-neutral-900 text-sm mb-1 dark:text-neutral-100"
        :for="id"
      >{{ props.label }}</label>
      <div
        class="flex flex-row gap-4 p-2 w-full shadow-xs ring-1 ring-inset ring-gray-300 rounded-md border-0"
      >
        <input
          v-show="false"
          ref="fileInput"
          :placeholder="label"
          class="cursor-pointer select-none py-1.5 text-gray-900 placeholder:text-gray-400 sm:text-sm sm:leading-6"
          readonly
          type="file"
          @change="selectFile"
          @mousedown.prevent="emits('clicked')"
        >
        <div v-if="selectedLocalFile" class="flex flex-row gap-4">
          <img
            v-if="isImage && fileUrl"
            :alt="label"
            :src="fileUrl"
            class="max-w-24 max-h-24"
          >
          <DocumentIcon v-else class="w-24 h-24 text-gray-600" />
          <div class="text-gray-600 my-auto">
            {{ selectedLocalFile.name
            }}<span v-if="selectedFile && selectedFile.size">
              ({{ selectedFileSizeKB }} KB)</span>
          </div>
          <button
            class="bg-[#6BAD87] rounded-sm p-2 hover:cursor-pointer h-12 my-auto"
            @click="openFileInput"
          >
            {{ t('models.form.file.change') }}
          </button>
          <button
            class="bg-[#6BAD87] rounded-sm p-2 hover:cursor-pointer h-12 my-auto"
            @click="uploadFile"
          >
            {{ t('models.form.file.upload') }}
          </button>
        </div>
        <div v-else-if="uploadedMedia" class="max-w-full flex flex-col gap-4">
          <div class="flex flex-row gap-4 w-full justify-between">
            <MediaPreview :media="uploadedMedia" class="grow h-48" />
            <button
              class="shrink bg-[#6BAD87]/50 rounded-sm p-2 hover:cursor-pointer my-auto"
              @click.prevent="openFileModal = true"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
          </div>
          <div class="text-gray-600 text-sm my-auto max-w-full truncate">
            {{ uploadedMedia.title }}
          </div>
        </div>
        <div v-else class="flex flex-row gap-4 w-full justify-between">
          <div class="text-gray-600 my-auto">
            {{ t('models.form.file.noSelection') }}
          </div>
          <div class="my-auto">
            <button
              class="bg-[#6BAD87]/50 rounded-sm p-2 hover:cursor-pointer my-auto"
              @click.prevent="openFileModal = true"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
        <MediaModal
          :open="openFileModal"
          @cancel="openFileModal = false"
          @confirm="(items) => updateFileFromModal(items)"
        />
      </div>
    </div>
  </div>
</template>
