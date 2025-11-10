<script setup lang="ts">
import type { FieldView } from "../../lib/field-view.ts";
import { computed } from "vue";
import { z } from "zod/v4";

const props = defineProps<{ fieldView: FieldView }>();

const link = computed(() => {
  if (z.url().safeParse(props.fieldView.value).success) {
    return z.url().parse(props.fieldView.value);
  }
  else if (z.email().safeParse(props.fieldView.value).success) {
    return `mailto:${z.email().parse(props.fieldView.value)}`;
  }
  return null;
});
</script>

<template>
  <a v-if="link" :href="link" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800">{{ props.fieldView.value }}</a>
  <span v-else>{{ props.fieldView.value }}</span>
</template>
