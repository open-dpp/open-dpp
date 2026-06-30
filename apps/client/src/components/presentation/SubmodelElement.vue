<script lang="ts" setup>
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { computed } from "vue";
import { useLanguageTexts } from "../../composables/language-text.ts";
import { usePresentationDispatch } from "./presentation-dispatch";
import SubmodelElementValue from "./SubmodelElementValue.vue";

const { element, parentPath } = defineProps<{
  element: SubmodelElementResponseDto;
  parentPath?: string;
}>();

const { text: elementName } = useLanguageTexts(element.displayName);

const isComplexType = computed(() =>
  ["SubmodelElementList", "File", "SubmodelElementCollection"].includes(element.modelType),
);

const fullPath = computed(() =>
  parentPath ? `${parentPath}.${element.idShort}` : element.idShort,
);

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
    <dt v-if="!selfCaptioning" class="shrink-0 text-sm font-medium text-gray-500">
      {{ elementName }}
    </dt>
    <SubmodelElementValue :element="element" :path="fullPath" />
  </div>
</template>
