<script setup lang="ts">
import type { Page } from "../../composables/pagination.ts";
import { useI18n } from "vue-i18n";

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

const { t } = useI18n();
</script>

<template>
  <div
    class="border-primary flex w-full items-center justify-between gap-4 rounded-full border bg-transparent px-2 py-1"
  >
    <div class="g-1">
      <Button icon="pi pi-home" rounded text @click="emits('resetCursor')" />
      <Button
        :disabled="!props.hasPrevious"
        icon="pi pi-chevron-left"
        rounded
        text
        @click="emits('previousPage')"
      />
    </div>
    <div class="text-color font-medium">
      <span class="hidden sm:block">{{
        t("pagination.footer", {
          from: currentPage.from + 1,
          to: currentPage.to + 1,
          count: currentPage.itemCount,
        })
      }}</span>
    </div>
    <Button
      icon="pi pi-chevron-right"
      rounded
      text
      :disabled="!props.hasNext"
      @click="emits('nextPage')"
    />
  </div>
</template>

<style scoped></style>
