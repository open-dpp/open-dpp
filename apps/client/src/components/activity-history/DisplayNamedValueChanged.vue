<script setup lang="ts">
import { type LanguageTextChangedDto } from "@open-dpp/dto";
import DiffViewer from "./DiffViewer.vue";
import { formatPropertyValue } from "../../lib/property-value.ts";

const props = defineProps<{ values: LanguageTextChangedDto[] }>();
</script>

<template>
  <div v-for="(value, index) in props.values" :key="index" class="flex flex-col gap-2">
    <Divider align="center" type="dotted">
      <b>{{ value.lng }}</b>
    </Divider>
    <DiffViewer v-if="value.op === 'replace' && value.oldValue && value.newValue">
      <template #oldValue>
        {{ value.oldValue }}
      </template>
      <template #newValue> {{ value.newValue }} </template>
    </DiffViewer>
  </div>
</template>

<style scoped></style>
