<script lang="ts" setup>
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { useDisplayName } from "../../composables/display-name";
import SubmodelElementValue from "./SubmodelElementValue.vue";

const { element } = defineProps<{
  element: SubmodelElementResponseDto;
}>();

const { description: elementName } = useDisplayName(element.displayName);
</script>

<template>
  <div :data-cy="element.idShort" class="px-4 py-6 sm:col-span-1 sm:px-0 m-2">
    <dt class="text-sm/6 font-bold text-gray-900">
      {{ elementName }}
    </dt>
    <SubmodelElementValue :element="element" />
  </div>
</template>
