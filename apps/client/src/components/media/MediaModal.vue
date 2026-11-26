<script lang="ts" setup>
import type { MediaInfo } from "./MediaInfo.interface";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useMediaUpload } from "../../composables/media-upload";
import MediaGrid from "./MediaGrid.vue";

const emits = defineEmits<{
  (e: "confirm", files: Array<MediaInfo>): void;
}>();
const open = defineModel<boolean>();
const { t } = useI18n();
const { accept, onFileSelect } = useMediaUpload();

const selected = ref<Array<MediaInfo>>([]);

watch(
  () => open.value,
  (newVal) => {
    if (newVal) {
      selected.value = [];
    }
  },
);
</script>

<template>
  <Dialog v-model:visible="open" modal class="w-3/4" @mousedown.stop>
    <template #header>
      <span class="text-xl font-bold">{{ t("file.select") }}</span>
      <FileUpload
        mode="basic"
        :auto="true"
        :accept="accept"
        :choose-label="t('file.upload')"
        custom-upload
        @select="onFileSelect"
      />
    </template>
    <div class="max-h-[60vh] overflow-y-auto px-4 py-2 sm:px-6 sm:py-4">
      <MediaGrid
        :multiple="false"
        :selected="selected"
        selectable
        @update-selected-items="(items) => (selected = items)"
      />
    </div>
    <template #footer>
      <Button
        :label="t('common.abort')"
        variant="outlined"
        severity="secondary"
        @click="open = false"
      />
      <Button
        :disabled="selected.length === 0"
        type="button"
        :label="t('common.select')"
        @click="emits('confirm', selected)"
      />
    </template>
    <div class="mt-5 flex flex-row justify-end gap-2 sm:mt-4" />
  </Dialog>
</template>
