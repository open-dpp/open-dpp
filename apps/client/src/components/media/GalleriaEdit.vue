<script setup lang="ts">
import type { MediaInfo } from "./MediaInfo.interface.ts";
import { Button, Column, DataTable, Image } from "primevue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import MediaModal from "./MediaModal.vue";

const emits = defineEmits<{
  (e: "addImage", images: MediaInfo): void;
  (e: "removeImage", image: MediaInfo): void;
  (e: "moveImage", image: MediaInfo, newPosition: number): void;
  (e: "modifyImage", image: MediaInfo, newMediaInfo: MediaInfo): void;
}>();
const { t } = useI18n();
const images = defineModel<{ blob: Blob | null; mediaInfo: MediaInfo; url: string }[]>();
const openMediaModal = ref(false);
const imageToModiy = ref<MediaInfo | null>(null);

function isFirst(index: number) {
  return index === 0;
}

function isLast(index: number) {
  if (!images.value) {
    return false;
  }
  return index === images.value.length - 1;
}

function onMediaModalConfirm(images: Array<MediaInfo>) {
  if (images.length > 0 && images[0]) {
    if (imageToModiy.value) {
      emits("modifyImage", imageToModiy.value, images[0]);
      imageToModiy.value = null;
    }
    else {
      emits("addImage", images[0]);
    }
    openMediaModal.value = false;
  }
}

function onModifyImage(image: MediaInfo) {
  imageToModiy.value = image;
  openMediaModal.value = true;
}

function onMoveImageUp(image: MediaInfo) {
  if (images.value) {
    const index = images.value.findIndex(i => i.mediaInfo.id === image.id);
    if (index > 0) {
      emits("moveImage", image, index - 1);
    }
  }
}
function onMoveImageDown(image: MediaInfo) {
  if (images.value) {
    const index = images.value.findIndex(i => i.mediaInfo.id === image.id);
    if (index > -1 && index < images.value?.length - 1) {
      emits("moveImage", image, index + 1);
    }
  }
}
</script>

<template>
  <div>
    <DataTable :value="images">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xl font-bold">{{ t("media.media") }}</span>
          <Button
            data-cy="add-image"
            icon="pi pi-plus"
            rounded
            raised
            @click="openMediaModal = true"
          />
        </div>
      </template>
      <Column field="mediaInfo.title" :header="t('media.title')" />
      <Column :header="t('media.preview')">
        <template #body="slotProps">
          <Image :src="slotProps.data.url" preview width="100px" />
        </template>
      </Column>
      <Column class="w-24 !text-end">
        <template #body="{ data, index }">
          <div class="flex items-center rounded-md gap-2">
            <Button
              icon="pi pi-pencil"
              :data-cy="`modify-media-${data.mediaInfo.id}`"
              severity="primary"
              rounded
              @click="onModifyImage(data.mediaInfo)"
            />
            <Button
              icon="pi pi-chevron-up"
              :data-cy="`move-media-${data.mediaInfo.id}-up`"
              severity="secondary"
              :disabled="isFirst(index)"
              rounded
              @click="onMoveImageUp(data.mediaInfo)"
            />
            <Button
              icon="pi pi-chevron-down"
              :data-cy="`move-media-${data.mediaInfo.id}-down`"
              severity="secondary"
              :disabled="isLast(index)"
              rounded
              @click="onMoveImageDown(data.mediaInfo)"
            />
            <Button
              icon="pi pi-trash"
              :data-cy="`delete-media-${data.mediaInfo.id}`"
              severity="danger"
              rounded
              @click="emits('removeImage', data.mediaInfo)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
    <MediaModal
      class="z-1200"
      :open="openMediaModal"
      @cancel="openMediaModal = false"
      @confirm="onMediaModalConfirm"
    />
  </div>
</template>
