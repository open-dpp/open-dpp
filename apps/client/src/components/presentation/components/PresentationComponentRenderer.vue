<script lang="ts" setup>
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { usePresentationDispatch } from "../presentation-dispatch";

// Dispatcher for presentation components. Given an element and its
// fully-qualified path, looks up the currently-configured component from the
// injected presentation config and renders it. Falls back to the default slot
// when no component is configured, so call sites can keep their own default
// rendering logic untouched.
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
