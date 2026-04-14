<script lang="ts" setup>
import type { MediaInfo } from "../../media/MediaInfo.interface.ts";
import { PencilIcon } from "@heroicons/vue/16/solid";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useMediaFile } from "../../../composables/media-file.ts";
import MediaModal from "../../media/MediaModal.vue";
import MediaPreview from "../../media/MediaPreview.vue";

const props = defineProps<{ disabled?: boolean }>();
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
    <div class="group mb-4 min-w-0 grow text-base" style="position: relative">
      <div class="mb-1.5 flex flex-col items-start justify-start last:mb-0">
        <div
          class="flex w-full flex-row gap-4 rounded-md border-0 p-2 shadow-xs ring-1 ring-gray-300 ring-inset"
        >
          <div v-if="mediaInfo" class="flex max-w-full flex-col gap-4">
            <div class="flex w-full flex-row justify-between gap-4">
              <MediaPreview :media="mediaInfo" class="h-48 grow" />
              <Button
                size="small"
                class="my-auto shrink"
                :disabled="props.disabled"
                @click.prevent="openFileModal = true"
              >
                <PencilIcon class="h-4 w-4" />
              </Button>
            </div>
            <div class="my-auto max-w-full truncate text-sm text-gray-600">
              {{ mediaInfo.title }}
            </div>
          </div>
          <div v-else class="flex w-full flex-row justify-between gap-4">
            <div class="my-auto text-gray-600">
              {{ t("file.noSelection") }}
            </div>
            <div class="my-auto">
              <Button size="small" :disabled="props.disabled" @click.prevent="openFileModal = true">
                <PencilIcon class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <MediaModal v-model="openFileModal" @confirm="(items) => updateFileFromModal(items)" />
    </div>
  </div>
</template>
