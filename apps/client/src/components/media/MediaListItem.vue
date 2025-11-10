<script lang="ts" setup>
import type { MediaInfo } from "./MediaInfo.interface";
import MediaPreview from "./MediaPreview.vue";

defineProps<{
  media: MediaInfo;
  selectable?: boolean;
  isSelected?: boolean;
}>();

const emits = defineEmits<{
  (e: "onSelect", id: MediaInfo): void;
}>();
</script>

<template>
  <div
    :class="{
      'hover:cursor-pointer hover:shadow-sm': selectable,
      'hover:cursor-default': !selectable,
      'ring-2 ring-[#6BAD87] ring-offset-2 ring-offset-gray-100': isSelected,
    }"
    class="p-2 rounded"
    @click="selectable && emits('onSelect', media)"
  >
    <MediaPreview :media="media" :show-type="true" :preview="false" />
    <p class="mt-2 block truncate text-sm font-medium text-gray-900">
      {{ media.title }}
    </p>
    <p class="block text-sm font-medium text-gray-500">
      {{ (media.size / 1024 / 1024).toFixed(2) }} MB
    </p>
  </div>
</template>
