<script lang="ts" setup>
import type { PresentationConfigurationDto, SubmodelElementResponseDto } from "@open-dpp/dto";
import { usePresentationDispatch } from "../presentation-dispatch";

const { element, path, config } = defineProps<{
  element: SubmodelElementResponseDto;
  path?: string;
  config?: PresentationConfigurationDto | null;
}>();

const { component } = usePresentationDispatch(
  () => element,
  () => path,
  () => config,
);
</script>

<template>
  <component :is="component" v-if="component" :element="element" />
  <slot v-else />
</template>
