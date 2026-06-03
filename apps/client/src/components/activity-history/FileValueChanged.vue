<script setup lang="ts">
import DiffViewer from "./DiffViewer.vue";
import MediaFieldView from "../media/MediaFieldView.vue";
import IdShortPath from "./IdShortPath.vue";

const props = defineProps<{
  oldValue: { value: string | null; contentType: string | null };
  newValue: { value: string | null; contentType: string | null };
  path: string;
}>();
</script>

<template>
  <IdShortPath :path="props.path" />
  <DiffViewer>
    <template #oldValue>
      <MediaFieldView v-if="props.oldValue.value" :media-id="props.oldValue.value" />
    </template>
    <template #newValue>
      <MediaFieldView v-if="props.newValue.value" :media-id="props.newValue.value" />
    </template>
  </DiffViewer>
</template>

<style scoped></style>
