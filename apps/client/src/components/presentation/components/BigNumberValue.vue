<script lang="ts" setup>
import type { SubmodelElementResponseDto } from "@open-dpp/dto";

defineProps<{
  element: SubmodelElementResponseDto;
}>();
</script>

<template>
  <dd
    data-cy="bignumber"
    class="mt-1 text-4xl font-bold tracking-tight text-gray-900 tabular-nums sm:mt-2"
  >
    {{ element.value }}
  </dd>
</template>
