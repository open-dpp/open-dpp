<script lang="ts" setup>
import type { KeyTypesType, ReferenceValue } from "@open-dpp/dto";
import { computed } from "vue";
import { isSafeHref } from "../../lib/urls.ts";

const { model } = defineProps<{
  model: ReferenceValue;
}>();

const property = computed(() => {
  return model.keys.find((key) => key.type === "GlobalReference");
});

const safeHref = computed(() => {
  const raw = property?.value?.value.trim();
  return raw && isSafeHref(raw) ? raw : undefined;
});
</script>

<template>
  <dd>
    <a
      v-if="model.type === 'ExternalReference' && safeHref"
      :href="safeHref"
      target="_blank"
      rel="noopener noreferrer"
      class="text-primary-500 mt-1 text-sm/6 hover:underline sm:mt-2"
      >{{ safeHref }}</a
    >
    <span v-else-if="model.type === 'ExternalReference' && property?.value">
      {{ property.value }}
    </span>
  </dd>
</template>
