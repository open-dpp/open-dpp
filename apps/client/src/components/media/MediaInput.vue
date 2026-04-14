<script lang="ts" setup>
import type { MediaInfo } from "./MediaInfo.interface";
import { PencilIcon, TrashIcon } from "@heroicons/vue/16/solid";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useMediaFile } from "../../composables/media-file";
import MediaModal from "./MediaModal.vue";
import MediaPreview from "./MediaPreview.vue";

const { label } = defineProps<{
  label: string;
}>();

const openFileModal = ref(false);

const { download, mediaInfo } = useMediaFile();

const model = defineModel<string | null>();
const { t } = useI18n();

function updateFileFromModal(files: MediaInfo[]) {
  const id = files[0]?.id;
  if (id) {
    model.value = id;
    openFileModal.value = false;
  }
}

watch(
  () => model.value,
  (newModelValue) => {
    if (newModelValue) {
      download(newModelValue);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div
    class="group formkit-outer mb-4 min-w-0 grow text-base data-disabled:pointer-events-none data-disabled:opacity-50 data-disabled:select-none"
    data-auto-animate="true"
    data-complete="true"
    data-family="text"
    data-type="text"
    style="position: relative"
  >
    <div class="formkit-wrapper mb-1.5 flex flex-col items-start justify-start gap-2 last:mb-0">
      <label class="block text-sm leading-6 font-medium text-gray-900" for="input_1">{{
        label
      }}</label>
      <div class="flex w-full gap-4">
        <MediaPreview v-if="model && mediaInfo" :media="mediaInfo" class="h-48 grow" />
        <div v-else class="my-auto text-gray-600">
          {{ t("file.noSelection") }}
        </div>
        <div class="flex shrink flex-col justify-center gap-2">
          <button
            class="bg-primary-500/50 shrink rounded-sm p-2 hover:cursor-pointer"
            @click.prevent="openFileModal = true"
          >
            <PencilIcon class="h-4 w-4" />
          </button>
          <button
            v-if="model"
            class="shrink bg-red-200 rounded-sm p-2 hover:cursor-pointer"
            @click.prevent="model = null"
          >
            <TrashIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
      <MediaModal v-model="openFileModal" @confirm="(items) => updateFileFromModal(items)" />
    </div>
  </div>
</template>
