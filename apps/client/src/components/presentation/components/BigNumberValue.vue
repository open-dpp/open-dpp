<script lang="ts" setup>
import type { SubmodelElementResponseDto } from "@open-dpp/dto";

defineProps<{
  element: SubmodelElementResponseDto;
}>();
</script>

<template>
  <span
    data-cy="bignumber"
    class="block text-4xl font-bold tracking-tight text-gray-900 tabular-nums"
  >
    {{ element.value }}
  </span>
</template>
