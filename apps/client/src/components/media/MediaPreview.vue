<script lang="ts" setup>
import type { MediaInfo } from "./MediaInfo.interface";
import {
  DocumentIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/vue/24/solid";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useMediaStore } from "../../stores/media";
import RingLoader from "../navigation/RingLoader.vue";

const props = withDefaults(
  defineProps<{
    media: MediaInfo;
    showType?: boolean;
    preview?: boolean;
  }>(),
  { preview: true },
);
const { t } = useI18n();
const mediaStore = useMediaStore();

const url = ref<string | null>(null);
const loading = ref<boolean>(true);

async function loadMedia(media: MediaInfo) {
  loading.value = true;
  const blob = await mediaStore.downloadMedia(media.id);
  if (blob) {
    url.value = URL.createObjectURL(blob);
  }
  loading.value = false;
}

onMounted(async () => {
  await loadMedia(props.media);
});

onUnmounted(() => {
  if (url.value) {
    URL.revokeObjectURL(url.value);
  }
});

watch(
  () => props.media,
  async (newValue) => {
    await loadMedia(newValue);
  },
  { deep: true },
);
</script>

<template>
  <div
    class="relative flex w-full items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50"
  >
    <div v-if="loading" class="mx-auto my-auto">
      <RingLoader />
    </div>
    <Image
      v-else-if="url && media.mimeType.startsWith('image/')"
      class="flex h-full w-full items-center justify-center"
      image-class="max-w-full max-h-full object-contain"
      :src="url"
      :alt="media.title || ''"
      :preview="props.preview"
    />
    <div v-else class="flex h-full w-full items-center justify-center text-gray-400">
      <PhotoIcon v-if="media.mimeType.startsWith('image/')" class="h-1/3 w-1/3" />
      <VideoCameraIcon v-else-if="media.mimeType.startsWith('video/')" class="h-1/3 w-1/3" />
      <DocumentIcon v-else class="h-1/3 w-1/3" />
    </div>
    <div
      v-if="url === null && !loading"
      class="absolute top-1 right-1 z-10 max-w-[80%] rounded bg-red-500 px-2 py-1 text-xs text-white shadow-sm"
    >
      <div class="flex flex-row items-center justify-center gap-1">
        <ExclamationTriangleIcon class="h-3 w-3" />
        <span class="truncate">{{ t("file.notFound") }}</span>
      </div>
    </div>
    <div
      v-if="showType"
      class="bg-primary-500 absolute right-1 bottom-1 z-10 rounded px-2 py-0.5 text-xs text-white shadow-sm"
    >
      <div>
        {{ media.mimeType.substring(media.mimeType.indexOf("/") + 1) }}
      </div>
    </div>
  </div>
</template>
