<script lang="ts" setup>
import type { MediaInfo } from "./MediaInfo.interface";
import {
  ExclamationTriangleIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/vue/24/solid";
import { Image } from "primevue";
import { onMounted, onUnmounted, ref } from "vue";
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

onMounted(async () => {
  loading.value = true;
  const blob = await mediaStore.downloadMedia(props.media.id);
  if (blob) {
    url.value = URL.createObjectURL(blob);
  }
  loading.value = false;
});

onUnmounted(() => {
  if (url.value) {
    URL.revokeObjectURL(url.value);
  }
});
</script>

<template>
  <div class="relative w-full h-full">
    <div v-if="loading" class="mx-auto my-auto">
      <RingLoader />
    </div>
    <Image v-else-if="url && media.mimeType.startsWith('image/')" class="max-h-48 max-w-48 object-contain" image-class="max-h-48 max-w-48 object-contain" :src="url" :alt="url" :preview="props.preview" />
    <div v-else class="w-full h-full flex items-center justify-center">
      <PhotoIcon v-if="media.mimeType.startsWith('image/')" class="w-12 h-12" />
      <VideoCameraIcon
        v-else-if="media.mimeType.startsWith('video/')"
        class="w-12 h-12"
      />
      <i v-else class="pi pi-file" style="font-size: 150px" />
    </div>
    <div
      v-if="url === null"
      class="absolute top-1 right-1 h-fit w-36 z-10 bg-red-500 text-white text-[0.6rem] p-1 rounded"
    >
      <div class="flex flex-row gap-2 w-fit mx-auto">
        <ExclamationTriangleIcon class="w-4 h-4 my-auto" />
        <span>{{ t('file.notFound') }}</span>
      </div>
    </div>
    <div
      v-if="showType"
      class="absolute bottom-1 right-1 h-fit w-10 z-10 bg-[#6BAD87] text-white text-[0.6rem] p-1 rounded"
    >
      <div class="w-fit mx-auto">
        {{ media.mimeType.substring(media.mimeType.indexOf('/') + 1) }}
      </div>
    </div>
  </div>
</template>
