<script lang="ts" setup>
import type { MediaInfo } from "./MediaInfo.interface";
import { useI18n } from "vue-i18n";
import { formatFileSize } from "../../lib/file-size";
import MediaPreview from "./MediaPreview.vue";

defineProps<{
  media: MediaInfo;
  selectable?: boolean;
  isSelected?: boolean;
}>();

const emits = defineEmits<{
  (e: "onSelect", id: MediaInfo): void;
}>();

const { locale } = useI18n();
</script>

<template>
  <div
    :class="{
      'hover:cursor-pointer hover:shadow-sm': selectable,
      'hover:cursor-default': !selectable,
      'ring-primary-500 ring-2 ring-offset-2 ring-offset-gray-100': isSelected,
    }"
    class="flex h-64 w-64 flex-col gap-2 rounded"
    data-testid="media-list-item"
    @click="selectable && emits('onSelect', media)"
  >
    <MediaPreview :media="media" :show-type="true" :preview="false" class="grow" />
    <p class="mt-2 min-h-4 truncate text-sm font-medium text-gray-900">
      {{ media.title }}
    </p>
    <p class="text-sm font-medium text-gray-500">{{ formatFileSize(media.size, locale) }}</p>
  </div>
</template>
