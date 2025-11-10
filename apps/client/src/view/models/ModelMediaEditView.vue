<script setup lang="ts">
import type { MediaInfo } from "../../components/media/MediaInfo.interface.ts";
import { watch } from "vue";
import { useRoute } from "vue-router";
import GalleriaEdit from "../../components/media/GalleriaEdit.vue";
import { useModelsMediaStore } from "../../stores/models.media.edit.ts";

const route = useRoute();

const modelsMediaStore = useModelsMediaStore();

watch(
  () => route.params.modelId, // The store property to watch
  async () => {
    await modelsMediaStore.fetchModel(String(route.params.modelId));
    await modelsMediaStore.loadMedia();
  },
  { immediate: true }, // Optional: to run the watcher immediately when the component mounts
);

async function addMedia(image: MediaInfo) {
  await modelsMediaStore.addMediaReference(image);
}

async function removeMedia(image: MediaInfo) {
  await modelsMediaStore.removeMediaReference(image);
}

async function moveMedia(image: MediaInfo, newPosition: number) {
  await modelsMediaStore.moveMediaReference(image, newPosition);
}

async function modifyMedia(image: MediaInfo, newImage: MediaInfo) {
  await modelsMediaStore.modifyMediaReference(image, newImage);
}
</script>

<template>
  <GalleriaEdit
    v-model="modelsMediaStore.mediaFiles"
    @add-image="addMedia"
    @remove-image="removeMedia"
    @move-image="moveMedia"
    @modify-image="modifyMedia"
  />
</template>
