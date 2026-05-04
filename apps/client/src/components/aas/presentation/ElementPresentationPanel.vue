<script lang="ts" setup>
import type {
  PresentationComponentNameType,
  SubmodelElementSharedResponseDto,
} from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Select from "primevue/select";
import {
  applicableComponentOptions,
  DEFAULT_VALUE,
} from "../../../composables/element-presentation";
import { usePresentationConfigurationStore } from "../../../stores/presentation-configuration";

const props = defineProps<{
  element: SubmodelElementSharedResponseDto & { modelType: string; valueType?: string };
  path: string;
  disabled: boolean;
}>();

const { t } = useI18n();
const store = usePresentationConfigurationStore();

const componentOptions = computed(() =>
  applicableComponentOptions(props.element as any, t),
);

const hasApplicableComponents = computed(() => componentOptions.value.length > 1);

const selectedComponent = computed<string>(() => {
  const map = store.activeConfig?.elementDesign ?? {};
  return map[props.path] ?? DEFAULT_VALUE;
});

const showConfigPicker = computed(() => store.configs.length >= 2);

const configPickerOptions = computed(() =>
  store.configs.map((c) => ({
    label: c.label ?? t("aasEditor.presentationTab.configPicker.untitled"),
    value: c.id,
  })),
);

const activeConfigIdValue = computed(() => store.activeConfig?.id ?? null);

async function onComponentChange(next: string) {
  if (next === DEFAULT_VALUE) {
    await store.removeElementDesign(props.path);
  } else {
    await store.setElementDesign(props.path, next as PresentationComponentNameType);
  }
}

function onConfigChange(id: string) {
  store.setActiveConfigId(id);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="showConfigPicker" data-cy="presentation-config-picker" class="flex flex-col gap-1">
      <label class="text-sm font-medium text-gray-700">
        {{ t("aasEditor.presentationTab.configPicker.label") }}
      </label>
      <Select
        :model-value="activeConfigIdValue"
        :options="configPickerOptions"
        option-label="label"
        option-value="value"
        :disabled="disabled"
        class="w-full max-w-[20rem]"
        @update:model-value="onConfigChange"
      />
    </div>

    <div
      v-if="hasApplicableComponents"
      class="flex flex-col gap-1"
      data-cy="presentation-component-select"
    >
      <label class="text-sm font-medium text-gray-700">
        {{ t("aasEditor.presentationTab.component") }}
      </label>
      <Select
        :data-cy="`presentation-select-${props.path}`"
        :model-value="selectedComponent"
        :options="componentOptions"
        option-label="label"
        option-value="value"
        :disabled="disabled"
        class="w-full max-w-[20rem]"
        @update:model-value="onComponentChange"
      />
    </div>

    <p v-else data-cy="presentation-empty-state" class="text-sm text-gray-600">
      {{ t("aasEditor.presentationTab.empty") }}
    </p>
  </div>
</template>
