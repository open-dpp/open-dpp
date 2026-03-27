<script lang="ts" setup>
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { computed } from "vue";
import { useDisplayName } from "../../composables/display-name";
import SubmodelElementValue from "./SubmodelElementValue.vue";

const { element } = defineProps<{
  element: SubmodelElementResponseDto;
}>();

const { description: elementName } = useDisplayName(element.displayName);

const isComplexType = computed(() =>
  ["SubmodelElementList", "File", "SubmodelElementCollection"].includes(element.modelType),
);
</script>

<template>
  <div
    :id="element.idShort"
    :data-cy="element.idShort"
    class="border-b border-gray-50"
    :class="[
      isComplexType ? 'col-span-full py-5' : 'flex items-baseline justify-between gap-4 py-4',
    ]"
  >
    <dt class="text-sm font-medium text-gray-500 shrink-0">
      {{ elementName }}
    </dt>
    <SubmodelElementValue :element="element" />
  </div>
</template>
