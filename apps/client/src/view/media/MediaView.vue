<script lang="ts" setup>
import type { MediaInfo } from "../../components/media/MediaInfo.interface";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import MediaDetailsSidebar from "../../components/media/MediaDetailsSidebar.vue";
import MediaGrid from "../../components/media/MediaGrid.vue";
import { useMediaUpload } from "../../composables/media-upload";

const { t } = useI18n();
const { accept, onFileSelect } = useMediaUpload();

const selected = ref<Array<MediaInfo>>([]);
const sidebarOpen = ref<boolean>(false);

function updateSelected(items: Array<MediaInfo>) {
  selected.value = items;
  sidebarOpen.value = items.length === 1;
}
</script>

<template>
  <MediaDetailsSidebar
    v-model="sidebarOpen"
    :media="selected[0]"
    @update:model-value="updateSelected([])"
  />
  <div class="flex h-full w-full flex-row gap-3">
    <div class="mt-8 flex grow flex-col gap-10">
      <div class="flex justify-end">
        <FileUpload
          mode="basic"
          :auto="true"
          :accept="accept"
          :choose-label="t('file.upload')"
          custom-upload
          @select="onFileSelect"
        />
      </div>
      <div>
        <MediaGrid
          :multiple="false"
          :selectable="true"
          :selected="selected"
          @update-selected-items="updateSelected"
        />
      </div>
    </div>
  </div>
</template>
