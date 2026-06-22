<script setup lang="ts">
import { type ReferenceValue } from "@open-dpp/dto";
import DiffViewer from "./DiffViewer.vue";
import ReferenceLink from "./ReferenceLink.vue";
import IdShortPath from "./IdShortPath.vue";

const props = defineProps<{
  path: string;
  oldValue: ReferenceValue | null;
  newValue: ReferenceValue | null;
}>();
</script>

<template>
  <IdShortPath :path="props.path" />
  <DiffViewer>
    <template v-if="props.oldValue" #oldValue>
      <ReferenceLink :model="props.oldValue" />
    </template>
    <template v-if="props.newValue" #newValue>
      <ReferenceLink :model="props.newValue" />
    </template>
  </DiffViewer>
</template>

<style scoped></style>
