<script lang="ts" setup>
import type { MediaInfo } from "./MediaInfo.interface";
import {
  DocumentIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/vue/24/solid";
import { Image } from "primevue";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useMediaStore } from "../../stores/media";
import RingLoader from "../RingLoader.vue";

const props = withDefaults(defineProps<{
  media: MediaInfo;
  showType?: boolean;
  preview?: boolean;
}>(), { preview: true });
const { t } = useI18n();
const mediaStore = useMediaStore();

const url = ref<string | null>(null);
const loading = ref<boolean>(false);

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

watch(() => props.media, async (newValue) => {
  await loadMedia(newValue);
}, { deep: true });
</script>

<template>
  <div class="relative w-full h-full flex items-center justify-center bg-gray-50 rounded overflow-hidden border border-gray-200">
    <div v-if="loading" class="mx-auto my-auto">
      <RingLoader />
    </div>
    <Image
      v-else-if="url && media.mimeType.startsWith('image/')"
      class="w-full h-full flex items-center justify-center"
      image-class="max-w-full max-h-full object-contain"
      :src="url"
      :alt="url"
      :preview="props.preview"
    />
    <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
      <PhotoIcon v-if="media.mimeType.startsWith('image/')" class="w-1/3 h-1/3" />
      <VideoCameraIcon
        v-else-if="media.mimeType.startsWith('video/')"
        class="w-1/3 h-1/3"
      />
      <DocumentIcon v-else class="w-1/3 h-1/3" />
    </div>
    <div
      v-if="url === null && !loading"
      class="absolute top-1 right-1 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-sm max-w-[80%]"
    >
      <div class="flex flex-row gap-1 items-center justify-center">
        <ExclamationTriangleIcon class="w-3 h-3" />
        <span class="truncate">{{ t('file.notFound') }}</span>
      </div>
    </div>
    <div
      v-if="showType"
      class="absolute bottom-1 right-1 z-10 bg-[#6BAD87] text-white text-xs px-2 py-0.5 rounded shadow-sm"
    >
      <div>
        {{ media.mimeType.substring(media.mimeType.indexOf('/') + 1) }}
      </div>
    </div>
  </div>
</template>
