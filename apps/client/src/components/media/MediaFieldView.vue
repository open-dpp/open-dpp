<script setup lang="ts">
import { ArrowDownTrayIcon } from "@heroicons/vue/24/outline";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useMediaFile } from "../../composables/media-file.ts";
import MediaPreview from "./MediaPreview.vue";

const props = defineProps<{ mediaId: string }>();
const { t } = useI18n();

const { download, mediaInfo, fileUrl } = useMediaFile();

onMounted(async () => {
  await download(props.mediaId);
});
</script>

<template>
  <div v-if="mediaInfo" class="flex max-w-full flex-col gap-4">
    <div class="flex w-full flex-row gap-4">
      <MediaPreview :media="mediaInfo" class="h-48 grow" />
      <a
        v-if="fileUrl"
        :download="mediaInfo.title"
        :href="fileUrl"
        class="bg-primary-500/50 hover:bg-primary-500 my-auto h-8 w-8 shrink rounded-sm p-2 hover:cursor-pointer"
      >
        <ArrowDownTrayIcon class="h-4 w-4" />
      </a>
    </div>
  </div>
  <div v-else class="flex flex-row gap-4">
    {{ t("file.couldNotBeLoaded") }}
  </div>
</template>
