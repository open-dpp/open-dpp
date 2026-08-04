<script setup lang="ts">
import type { Page } from "../../composables/pagination.ts";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  currentPage: Page;
  hasPrevious: boolean;
  hasNext: boolean;
  totalCount?: number | null;
}>();

const emits = defineEmits<{
  (e: "nextPage"): Promise<void>;
  (e: "previousPage"): Promise<void>;
  (e: "resetCursor"): Promise<void>;
}>();

const { t } = useI18n();

// On an empty page (itemCount === 0) the 1-based range would invert (e.g. "1 - 0", or "0 - 10"
// on an empty later page); collapse both bounds to zero so every empty page shows "0 - 0".
const rangeFrom = computed(() =>
  props.currentPage.itemCount === 0 ? 0 : props.currentPage.from + 1,
);
const rangeTo = computed(() =>
  props.currentPage.itemCount === 0 ? 0 : props.currentPage.from + props.currentPage.itemCount,
);
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
      <span v-if="props.totalCount != null" class="hidden sm:block">{{
        t("pagination.footerWithTotal", {
          from: rangeFrom,
          to: rangeTo,
          total: props.totalCount,
        })
      }}</span>
      <span v-else class="hidden sm:block">{{
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
