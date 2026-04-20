<script lang="ts" setup>
import type {
  ReferenceValue,
  SubmodelElementCollectionResponseDto,
  SubmodelElementResponseDto,
} from "@open-dpp/dto";
import { DataTypeDef, PresentationComponentName } from "@open-dpp/dto";
import { computed, inject } from "vue";
import { useI18n } from "vue-i18n";
import { formatDateValueForDisplay } from "../../lib/date-value.ts";
import MediaFieldView from "../media/MediaFieldView.vue";
import BigNumberValue from "./components/BigNumberValue.vue";
import List from "./List.vue";
import { presentationConfigKey, resolveComponent } from "./presentation-config.ts";
import Reference from "./Reference.vue";
import SubmodelElementCollection from "./SubmodelElementCollection.vue";

const { element, path } = defineProps<{
  element: SubmodelElementResponseDto;
  path?: string;
}>();

const { t } = useI18n();

const configRef = inject(presentationConfigKey, null);

const resolvedComponent = computed(() => {
  if (!path) return undefined;
  return resolveComponent(configRef?.value ?? null, { path, modelType: element.modelType });
});

const isBigNumber = computed(
  () =>
    resolvedComponent.value === PresentationComponentName.BigNumber &&
    element.modelType === "Property" &&
    element.value !== null &&
    element.value !== undefined,
);
</script>

<template>
  <div v-if="!element.value" class="mt-1 text-sm/6 font-semibold text-red-800 sm:mt-2">
    {{ t("presentation.missingValue") }}
  </div>
  <BigNumberValue v-else-if="isBigNumber" :element="element" />
  <dd v-else-if="element.modelType === 'Property'" class="mt-1 text-sm/6 text-gray-700 sm:mt-2">
    <template v-if="element.valueType === 'Date'">
      {{ formatDateValueForDisplay(element.value as string, DataTypeDef.Date) }}
    </template>
    <template v-else-if="element.valueType === 'DateTime'">
      {{ formatDateValueForDisplay(element.value as string, DataTypeDef.DateTime) }}
    </template>
    <template v-else>
      {{ element.value }}
    </template>
  </dd>
  <Reference
    v-else-if="element.modelType === 'ReferenceElement'"
    :model="element.value as ReferenceValue"
  />
  <MediaFieldView
    v-else-if="element.modelType === 'File' && typeof element.value === 'string'"
    :media-id="element.value"
  />
  <List
    v-else-if="element.modelType === 'SubmodelElementList'"
    :content="element.value as SubmodelElementCollectionResponseDto[]"
  />
  <SubmodelElementCollection
    v-else-if="element.modelType === 'SubmodelElementCollection'"
    :id-short="element.idShort"
  />
</template>
