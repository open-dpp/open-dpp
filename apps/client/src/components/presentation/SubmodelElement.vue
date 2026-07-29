<script lang="ts" setup>
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { resolveLanguageTexts, useLanguageTexts } from "../../composables/language-text.ts";
import { usePresentationDispatch } from "../../lib/presentation/presentation-dispatch.ts";
import SubmodelElementValue from "./SubmodelElementValue.vue";

const { element, parentPath } = defineProps<{
  element: SubmodelElementResponseDto;
  parentPath?: string;
}>();

const { locale } = useI18n();
const { text: elementName } = useLanguageTexts(element.displayName);

// Resolve the description with an empty fallback so nothing renders when the field
// has no description (unlike the name, which falls back to a placeholder).
const descriptionText = computed(() => resolveLanguageTexts(element.description, locale.value, ""));

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
      <p v-if="descriptionText" class="mt-0.5 text-xs font-normal text-gray-400">
        {{ descriptionText }}
      </p>
    </dt>
    <SubmodelElementValue :element="element" :path="fullPath" />
  </div>
</template>
