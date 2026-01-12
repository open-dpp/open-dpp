<script setup lang="ts">
import type { Page } from "../../composables/pagination.ts";
import { Button } from "primevue";

const props = defineProps<{
  currentPage: Page;
  hasPrevious: boolean;
  hasNext: boolean;
}>();

const emits = defineEmits<{
  (e: "nextPage"): Promise<void>;
  (e: "previousPage"): Promise<void>;
  (e: "resetCursor"): Promise<void>;
}>();
</script>

<template>
  <div class="flex items-center gap-4 border border-primary bg-transparent rounded-full w-full py-1 px-2 justify-between">
    <div class="g-1">
      <Button icon="pi pi-home" rounded text @click="emits('resetCursor')" />
      <Button :disabled="!props.hasPrevious" icon="pi pi-chevron-left" rounded text @click="emits('previousPage')" />
    </div>
    <div class="text-color font-medium">
      <span class="hidden sm:block">Showing: {{ currentPage.from + 1 }} to {{ currentPage.to + 1 }}, Count: {{ currentPage.itemCount }}</span>
    </div>
    <Button icon="pi pi-chevron-right" rounded text :disabled="!props.hasNext" @click="emits('nextPage')" />
  </div>
</template>

<style scoped>

</style>
