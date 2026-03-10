<script lang="ts" setup>
import type { ReferenceValue } from "@open-dpp/dto";
import { computed } from "vue";

const { model } = defineProps<{
  model: ReferenceValue;
}>();

const property = computed(() => {
  return model.keys.find((key) => key.type === "GlobalReference");
});

const safeHref = computed(() => {
  const raw = property.value?.value?.trim();
  if (!raw) return undefined;
  try {
    const parsed = new URL(raw);
    return ["http:", "https:"].includes(parsed.protocol)
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
});
</script>

<template>
  <dd>
    <a
      v-if="model.type === 'ExternalReference' && property"
      :href="property.value"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-1 text-sm/6 text-primary-500 hover:underline sm:mt-2"
      >{{ safeHref }}</a
    >
  </dd>
</template>
