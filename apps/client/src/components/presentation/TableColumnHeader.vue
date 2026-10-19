<script lang="ts" setup>
import { InformationCircleIcon } from "@heroicons/vue/16/solid";

defineProps<{
  header: string;
  description: string;
}>();
</script>

<template>
  <span class="inline-flex items-center gap-1">
    {{ header }}
    <span v-if="description" v-tooltip.top="description" class="inline-flex shrink-0">
      <InformationCircleIcon class="size-4 text-gray-400" />
    </span>
  </span>
</template>
