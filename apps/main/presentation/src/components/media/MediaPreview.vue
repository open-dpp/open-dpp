<template>
  <div class="h-[150px] w-full rounded-lg bg-[#6BAD87]/10 relative">
    <div v-if="loading" class="mx-auto my-auto">
      <RingLoader />
    </div>
    <img v-else-if="url" :alt="url" :src="url" />
    <div v-else class="w-full h-full flex items-center justify-center">
      <PhotoIcon v-if="media.mimeType.startsWith('image/')" class="w-12 h-12" />
      <VideoCameraIcon
        v-else-if="media.mimeType.startsWith('video/')"
        class="w-12 h-12"
      />
      <DocumentIcon v-else class="w-12 h-12" />
    </div>

    <Popover v-slot="{ open }">
      <div
        v-if="url === null"
        class="absolute top-1 right-1 h-fit w-36 z-10 bg-red-500 text-white text-[0.6rem] p-1 rounded"
      >
        <div class="flex flex-row gap-2 w-fit mx-auto">
          <ExclamationTriangleIcon class="w-4 h-4 my-auto" />
          <span>Datei nicht vorhanden</span>
        </div>
      </div>
      <div v-if="open">
        <PopoverPanel class="z-20" static>
          <div class="grid grid-cols-2">
            <a href="/analytics">Analytics</a>
            <a href="/engagement">Engagement</a>
            <a href="/security">Security</a>
            <a href="/integrations">Integrations</a>
          </div>
        </PopoverPanel>
      </div>
    </Popover>
    <div
      v-if="showType"
      class="absolute bottom-1 right-1 h-fit w-10 z-10 bg-[#6BAD87] text-white text-[0.6rem] p-1 rounded"
    >
      <div class="w-fit mx-auto">
        {{ media.mimeType.substring(media.mimeType.indexOf("/") + 1) }}
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import RingLoader from "../RingLoader.vue";
import { useMediaStore } from "../../stores/media";
import { onMounted, onUnmounted, ref } from "vue";
import { MediaInfo } from "./MediaInfo.interface";
import {
  DocumentIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/vue/24/solid";

import { Popover, PopoverPanel } from "@headlessui/vue";

const mediaStore = useMediaStore();

const props = defineProps<{
  media: MediaInfo;
  showType?: boolean;
}>();

const url = ref<string | null>(null);
const loading = ref<boolean>(false);

onMounted(async () => {
  loading.value = true;
  try {
    const blob = await mediaStore.downloadMedia(props.media.id);
    if (blob) {
      url.value = URL.createObjectURL(blob);
    } else {
      url.value = null;
    }
  } catch {
    url.value = null;
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  if (url.value) {
    URL.revokeObjectURL(url.value);
  }
});
</script>
