<script lang="ts" setup>
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { usePresentationConfigurationStore } from "../../../stores/presentation-configuration";
import SubmodelElementValue from "../../presentation/SubmodelElementValue.vue";
import { PRESENTATION_COMPONENTS } from "../../presentation/components/presentation-components";
import { resolveComponent } from "../../presentation/presentation-config";

const props = defineProps<{
  element: SubmodelElementResponseDto;
  path: string;
}>();

const { t } = useI18n();
const store = usePresentationConfigurationStore();

const resolvedName = computed(() =>
  resolveComponent(store.activeConfig, {
    path: props.path,
    modelType: props.element.modelType,
  }),
);

const sampleResult = computed(() => {
  const name = resolvedName.value;
  const entry = name ? PRESENTATION_COMPONENTS[name] : undefined;
  if (entry) {
    return entry.sampleElement(props.element);
  }
  return { element: props.element, usedSample: false };
});

const previewElement = computed(() => sampleResult.value.element);
const usedSample = computed(() => sampleResult.value.usedSample);
</script>

<template>
  <div
    data-cy="presentation-preview-frame"
    class="border-surface-200 bg-surface-0 flex flex-col gap-3 rounded-xl border p-4 shadow-sm"
  >
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-sm font-medium text-gray-700">
        {{ t("aasEditor.presentationTab.preview") }}
      </h3>
      <span
        v-if="usedSample"
        data-cy="presentation-preview-sample-badge"
        class="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
      >
        {{ t("aasEditor.presentationTab.previewSampleBadge") }}
      </span>
    </div>
    <div data-cy="presentation-preview-content">
      <SubmodelElementValue
        :element="previewElement"
        :path="path"
        :config="store.activeConfig"
      />
    </div>
  </div>
</template>
