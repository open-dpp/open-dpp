<script lang="ts" setup>
import type { ReferenceValue } from "@open-dpp/dto";
import { computed } from "vue";

const { model } = defineProps<{
  model: ReferenceValue;
}>();

const property = computed(() => {
  return model.keys.find(key => key.type === "GlobalReference");
});
</script>

<template>
  <dd>
    <a
      v-if="model.type === 'ExternalReference' && property"
      :href="property.value"
      target="blank"
      class="mt-1 text-sm/6 text-gray-700 sm:mt-2"
    >{{ property.value }}</a>
  </dd>
</template>
