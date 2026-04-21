<script lang="ts" setup>
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { computed } from "vue";
import { useDisplayName } from "../../composables/display-name";
import { usePresentationDispatch } from "./presentation-dispatch";
import SubmodelElementValue from "./SubmodelElementValue.vue";

const { element, parentPath } = defineProps<{
  element: SubmodelElementResponseDto;
  parentPath?: string;
}>();

const { description: elementName } = useDisplayName(element.displayName);

const isComplexType = computed(() =>
  ["SubmodelElementList", "File", "SubmodelElementCollection"].includes(element.modelType),
);

const fullPath = computed(() =>
  parentPath ? `${parentPath}.${element.idShort}` : element.idShort,
);

// Suppress the external `<dt>` label when the resolved presentation component
// renders its own caption (e.g. the BigNumber card). This keeps the label
// visible exactly once instead of duplicating it next to the card.
const { selfCaptioning } = usePresentationDispatch(
  () => element,
  () => fullPath.value,
);
</script>

<template>
  <div
    :id="element.idShort"
    :data-cy="element.idShort"
    class="border-b border-gray-50"
    :class="[
      isComplexType || selfCaptioning
        ? 'col-span-full py-5'
        : 'flex items-baseline justify-between gap-4 py-4',
    ]"
  >
    <dt
      v-if="!selfCaptioning"
      class="shrink-0 text-sm font-medium text-gray-500"
    >
      {{ elementName }}
    </dt>
    <SubmodelElementValue :element="element" :path="fullPath" />
  </div>
</template>
