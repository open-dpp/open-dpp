<script setup lang="ts">
import type { MediaInfo } from "../media/MediaInfo.interface.ts";
import { Button, Column, DataTable, Dialog, Image } from "primevue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import MediaModal from "../media/MediaModal.vue";

const props = defineProps<{ title: string; images: { blob: Blob | null; mediaInfo: MediaInfo; url: string }[] }>();
const emits = defineEmits<{
  (e: "addImages", images: Array<MediaInfo>): void;
}>();
const { t } = useI18n();
const visible = defineModel<boolean>("visible");
const openMediaModal = ref(false);

function isFirst(index: number) {
  return index === 0;
}

function isLast(index: number) {
  return index === props.images.length - 1;
}

function onAddImages(images: Array<MediaInfo>) {
  emits("addImages", images);
  openMediaModal.value = false;
}
</script>

<template>
  <div>
    <Dialog
      v-model:visible="visible"
      modal
      :header="props.title"
      :style="{ width: '50vw' }"
    >
      <DataTable :value="props.images">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xl font-bold">{{ t('media.media') }}</span>
            <Button icon="pi pi-plus" rounded raised @click="openMediaModal = true" />
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
              <Button icon="pi pi-pencil" :data-cy="`edit-${data.title}`" severity="primary" rounded />
              <Button icon="pi pi-chevron-up" :data-cy="`move-data-field-${data.id}-up`" severity="secondary" :disabled="isFirst(index)" rounded />
              <Button icon="pi pi-chevron-down" :data-cy="`move-data-field-${data.id}-down`" severity="secondary" :disabled="isLast(index)" rounded />
              <Button icon="pi pi-trash" :data-cy="`delete-${data.title}`" severity="danger" rounded />
            </div>
          </template>
        </Column>
      </DataTable>
    </Dialog>
    <MediaModal
      class="z-1200"
      :open="openMediaModal"
      @cancel="openMediaModal = false"
      @confirm="onAddImages"
    />
  </div>
</template>
