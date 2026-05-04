<script lang="ts" setup>
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { usePresentationDispatch } from "../presentation-dispatch";

const { element, path } = defineProps<{
  element: SubmodelElementResponseDto;
  path?: string;
}>();

const { component } = usePresentationDispatch(
  () => element,
  () => path,
);
</script>

<template>
  <component :is="component" v-if="component" :element="element" />
  <slot v-else />
</template>
