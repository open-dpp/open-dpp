<script setup lang="ts">
import { type ReferenceValue } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import DiffViewer from "./DiffViewer.vue";
import Reference from "../presentation/Reference.vue";
import IdShortPath from "./IdShortPath.vue";

const { locale } = useI18n();

const props = defineProps<{
  path: string;
  oldValue: ReferenceValue;
  newValue: ReferenceValue;
}>();
</script>

<template>
  <IdShortPath :path="props.path" />
  <DiffViewer>
    <template #oldValue>
      <Reference :model="props.oldValue" />
    </template>
    <template #newValue>
      <Reference :model="props.newValue" />
    </template>
  </DiffViewer>
</template>

<style scoped></style>
