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
    class="group grow min-w-0 text-base mb-4 data-disabled:select-none data-disabled:opacity-50 data-disabled:pointer-events-none formkit-outer"
    data-auto-animate="true"
    data-complete="true"
    data-family="text"
    data-type="text"
    style="position: relative"
  >
    <div
      class="mb-1.5 flex flex-col gap-2 items-start justify-start last:mb-0 formkit-wrapper"
    >
      <label
        class="block text-sm font-medium leading-6 text-gray-900"
        for="input_1"
      >{{ label }}</label>
      <div class="flex w-full gap-4">
        <MediaPreview
          v-if="model && mediaInfo"
          :media="mediaInfo"
          class="grow h-48"
        />
        <div v-else class="text-gray-600 my-auto">
          {{ t("file.noSelection") }}
        </div>
        <div class="flex flex-col justify-center gap-2 shrink">
          <button
            class="shrink bg-primary-500/50 rounded-sm p-2 hover:cursor-pointer"
            @click.prevent="openFileModal = true"
          >
            <PencilIcon class="h-4 w-4" />
          </button>
          <button
            v-if="model"
            class="shrink bg-red-200 rounded-sm p-2 hover:cursor-pointer"
            @click.prevent="model = undefined"
          >
            <TrashIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
      <MediaModal
        v-model="openFileModal"
        @confirm="(items) => updateFileFromModal(items)"
      />
    </div>
  </div>
</template>
