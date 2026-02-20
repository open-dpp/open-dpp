<script lang="ts" setup>
import type { MediaInfo } from "../../media/MediaInfo.interface.ts";
import { PencilIcon } from "@heroicons/vue/16/solid";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useMediaFile } from "../../../composables/media-file.ts";
import MediaModal from "../../media/MediaModal.vue";
import MediaPreview from "../../media/MediaPreview.vue";

const mediaInfoId = defineModel<string>();
const contentType = defineModel<string>("contentType");
const { t } = useI18n();

const { download, mediaInfo } = useMediaFile();
const openFileModal = ref<boolean>(false);

watch(
  () => mediaInfoId.value,
  async (newMediaInfoId) => {
    if (newMediaInfoId) {
      await download(newMediaInfoId);
    }
  },
  { immediate: true },
);

async function updateFileFromModal(items: Array<MediaInfo>) {
  if (items.length === 0) {
    openFileModal.value = false;
    return;
  }
  if (items.length > 0) {
    const newMediaInfo = items[0] as MediaInfo;
    contentType.value = newMediaInfo.mimeType;
    mediaInfoId.value = newMediaInfo.id;
    openFileModal.value = false;
  }
}
</script>

<template>
  <div>
    <div class="group grow min-w-0 text-base mb-4" style="position: relative">
      <div class="mb-1.5 flex flex-col items-start justify-start last:mb-0">
        <div
          class="flex flex-row gap-4 p-2 w-full shadow-xs ring-1 ring-inset ring-gray-300 rounded-md border-0"
        >
          <div v-if="mediaInfo" class="max-w-full flex flex-col gap-4">
            <div class="flex flex-row gap-4 w-full justify-between">
              <MediaPreview :media="mediaInfo" class="grow h-48" />
              <button
                class="shrink bg-[#6BAD87]/50 rounded-sm p-2 hover:cursor-pointer my-auto"
                @click.prevent="openFileModal = true"
              >
                <PencilIcon class="h-4 w-4" />
              </button>
            </div>
            <div class="text-gray-600 text-sm my-auto max-w-full truncate">
              {{ mediaInfo.title }}
            </div>
          </div>
          <div v-else class="flex flex-row gap-4 w-full justify-between">
            <div class="text-gray-600 my-auto">
              {{ t("models.form.file.noSelection") }}
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
        </div>
      </div>
      <MediaModal
        v-model="openFileModal"
        @confirm="(items) => updateFileFromModal(items)"
      />
    </div>
  </div>
</template>
