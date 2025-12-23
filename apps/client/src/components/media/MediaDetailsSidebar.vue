<script lang="ts" setup>
import type { MediaInfo } from "./MediaInfo.interface";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import { useI18n } from "vue-i18n";
import MediaPreview from "./MediaPreview.vue";

defineProps<{
  media: MediaInfo;
}>();

const emits = defineEmits<{
  (e: "close"): void;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-row gap-2 justify-between">
      <div class="text-xl font-bold">
        Details
      </div>
      <button
        class="hover:cursor-pointer"
        type="button"
        @click="emits('close')"
      >
        <XMarkIcon class="size-6" />
      </button>
    </div>
    <dl class="flex flex-col gap-4">
      <div class="flex-auto">
        <dt class="font-semibold text-gray-900 dark:text-gray-100">
          {{ t('common.id') }}
        </dt>
        <dd class="text-sm/6 mt-1 text-gray-900 dark:text-white">
          {{ media.id }}
        </dd>
      </div>
      <div class="flex-auto">
        <dt class="font-semibold text-gray-900 dark:text-gray-100">
          {{ t('media.preview') }}
        </dt>
        <dd class="text-sm/6 mt-1 text-gray-900 dark:text-white">
          <MediaPreview :key="media.id" :media="media" :preview="true" class="h-64 w-full" />
        </dd>
      </div>
      <div class="flex-auto">
        <dt class="font-semibold text-gray-900 dark:text-gray-100">
          {{ t('file.type') }}
        </dt>
        <dd class="text-sm/6 mt-1 text-gray-900 dark:text-white">
          {{ media.mimeType }}
        </dd>
      </div>
      <div class="flex-auto">
        <dt class="font-semibold text-gray-900 dark:text-gray-100">
          {{ t('file.size') }}
        </dt>
        <dd class="text-sm/6 mt-1 text-gray-900 dark:text-white">
          {{ (media.size / 1024 / 1024).toFixed(1) }} MB
        </dd>
      </div>
    </dl>
    <div class="flex flex-row gap-2 justify-end">
      <button
        class="bg-[#6BAD87] p-2 rounded text-white text-sm hover:cursor-pointer"
        @click="emits('close')"
      >
        {{ t('common.close') }}
      </button>
    </div>
  </div>
</template>
