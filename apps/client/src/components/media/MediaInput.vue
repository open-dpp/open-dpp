<script lang="ts" setup>
import type { MediaInfo, MediaResult } from "./MediaInfo.interface";
import { DocumentIcon, PencilIcon } from "@heroicons/vue/16/solid";
import InputText from "primevue/inputtext";
import { computed, onUnmounted, ref, useAttrs, watch } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client";
import { useIndexStore } from "../../stores";
import { useMediaStore } from "../../stores/media";
import { useNotificationStore } from "../../stores/notification";
import { usePassportFormStore } from "../../stores/passport.form";
import MediaModal from "./MediaModal.vue";
import MediaPreview from "./MediaPreview.vue";

const props = withDefaults(defineProps<{
  id: string;
  label: string;
  value: MediaResult | null;
  context?: "dpp" | "organization";
}>(), {
  context: "dpp",
});

const emits = defineEmits<{
  (e: "clicked"): void;
  (e: "update:value", value: MediaResult | null): void;
  (e: "updateById", value: string | null): void;
  (e: "selectFile", value: File | null): void;
}>();

const { t } = useI18n();
const passportFormStore = usePassportFormStore();
const indexStore = useIndexStore();
const notificationStore = useNotificationStore();
const mediaStore = useMediaStore();

const attrs = useAttrs() as Record<string, unknown>;

const fileInput = ref<HTMLInputElement>();
const selectedLocalFile = ref<File | null>(null);
const selectedFile = ref<MediaInfo | null>(null);
const uploadProgress = ref<number>(0);
const openFileModal = ref<boolean>(false);

const computedAttrs = computed(() => ({
  ...attrs,
}));

const isImage = computed(() => {
  if (!selectedLocalFile.value) {
    return false;
  }
  return selectedLocalFile.value.type.startsWith("image/");
});

const fileUrl = ref<string | null>(null);

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
    let mediaId: string;

    if (props.context === "organization") {
      mediaId = await apiClient.media.media.uploadOrganizationProfileMedia(
        indexStore.selectedOrganization,
        selectedLocalFile.value,
        (progress: number) => (uploadProgress.value = progress),
      );
    }
    else {
      mediaId = await mediaStore.uploadDppMedia(
        indexStore.selectedOrganization,
        passportFormStore.getUUID(),
        props.id,
        selectedLocalFile.value,
        (progress: number) => (uploadProgress.value = progress),
      );
    }

    const mediaResult = await mediaStore.fetchMedia(mediaId);
    selectedFile.value = mediaResult.mediaInfo;

    emits("updateById", mediaId);
    emits("update:value", mediaResult);

    notificationStore.addSuccessNotification(
      t("models.form.file.uploadSuccess"),
    );
    // selectedLocalFile.value = null;
    // await loadFile();
  }
  catch (error: unknown) {
    console.error("Fehler beim Hochladen der Datei:", error);
    notificationStore.addErrorNotification(t("models.form.file.uploadError"));
    selectedLocalFile.value = null;
  }
  finally {
    uploadProgress.value = 0;
  }
}

async function updateFileFromModal(items: Array<MediaInfo>) {
  if (items.length === 0) {
    openFileModal.value = false;
    return;
  }
  if (items.length > 0) {
    const item = items[0] as MediaInfo;
    emits("updateById", item.id);

    try {
      const result = await mediaStore.fetchMedia(item.id);
      emits("update:value", result);
      selectedFile.value = result.mediaInfo;
    }
    catch (e) {
      console.error("Failed to fetch selected media", e);
    }

    openFileModal.value = false;
    selectedLocalFile.value = null;
  }
}

onUnmounted(() => {
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value);
  }
});

watch(() => props.value, (newValue) => {
  if (newValue) {
    selectedLocalFile.value = null;
  }
}, { deep: true });

watch(selectedLocalFile, (newFile) => {
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value);
  }
  if (newFile) {
    fileUrl.value = URL.createObjectURL(newFile);
  }
  else {
    fileUrl.value = null;
  }
  emits("selectFile", newFile);
});
</script>

<template>
  <div
    class="group grow min-w-0 text-base mb-4 data-disabled:select-none data-disabled:opacity-50 data-disabled:pointer-events-none formkit-outer"
    data-auto-animate="true"
    data-complete="true"
    data-family="text"
    data-type="text"
    style="position: relative"
  >
    <div
      class="mb-1.5 flex flex-col items-start justify-start last:mb-0 formkit-wrapper"
    >
      <label
        class="block text-neutral-900 text-sm mb-1 dark:text-neutral-100 formkit-label"
        for="input_1"
      >{{ props.label }}</label>
      <div
        class="flex flex-row gap-4 p-2 w-full shadow-xs ring-1 ring-inset ring-gray-300 rounded-md border-0"
      >
        <InputText
          v-if="value"
          :value="value.mediaInfo.title"
          :data-cy="id"
          :name="id"
          type="hidden"
          v-bind="computedAttrs"
        />
        <form>
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
        </form>
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
            }}<span v-if="selectedFileSizeKB">
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
        <div v-else-if="value" class="max-w-full flex flex-col gap-4">
          <div class="flex flex-row gap-4 w-full justify-between">
            <MediaPreview :media="value.mediaInfo" class="grow h-48" />
            <button
              class="shrink bg-[#6BAD87]/50 rounded-sm p-2 hover:cursor-pointer my-auto"
              @click.prevent="openFileModal = true"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
          </div>
          <div class="text-gray-600 text-sm my-auto max-w-full truncate">
            {{ value.mediaInfo.title }}
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
          v-model="openFileModal"
          @cancel="openFileModal = false"
          @confirm="items => updateFileFromModal(items)"
        />
      </div>
    </div>
  </div>
</template>
