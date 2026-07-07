<script lang="ts" setup>
import type {
  PresentationConfigurationDto,
  SubmodelElementCollectionResponseDto,
  SubmodelElementResponseDto,
} from "@open-dpp/dto";
import { DataTypeDef } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import formatDateValueForDisplay from "../../lib/date-value.ts";
import MediaFieldView from "../media/MediaFieldView.vue";
import PresentationComponentRenderer from "./components/PresentationComponentRenderer.vue";
import List from "./List.vue";
import SubmodelElementCollection from "./SubmodelElementCollection.vue";
import { z } from "zod";
import { isSafeHref } from "../../lib/urls.ts";

const { element, path, config } = defineProps<{
  element: SubmodelElementResponseDto;
  path?: string;
  config?: PresentationConfigurationDto | null;
}>();

const { t } = useI18n();
</script>

<template>
  <div v-if="element.value == null" class="mt-1 text-sm/6 font-semibold text-red-800 sm:mt-2">
    {{ t("presentation.missingValue") }}
  </div>
  <PresentationComponentRenderer v-else :element="element" :path="path" :config="config">
    <dd v-if="element.modelType === 'Property'" class="mt-1 text-sm/6 text-gray-700 sm:mt-2">
      <template v-if="element.valueType === DataTypeDef.Date">
        {{ formatDateValueForDisplay(element.value as string, DataTypeDef.Date) }}
      </template>
      <template v-else-if="element.valueType === DataTypeDef.DateTime">
        {{ formatDateValueForDisplay(element.value as string, DataTypeDef.DateTime) }}
      </template>
      <template v-else-if="element.valueType === DataTypeDef.Boolean">
        <Checkbox
          class="pointer-events-none"
          :model-value="element.value === 'true'"
          disabled
          binary
        />
      </template>
      <template v-else-if="element.valueType === DataTypeDef.AnyUri && isSafeHref(element.value)">
        <a
          :href="String(element.value)"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary-500 mt-1 text-sm/6 hover:underline sm:mt-2"
          >{{ element.value }}</a
        >
      </template>
      <template v-else>
        {{ element.value }}
      </template>
    </dd>
    <MediaFieldView
      v-else-if="element.modelType === 'File' && typeof element.value === 'string'"
      :media-id="element.value"
    />
    <List
      v-else-if="element.modelType === 'SubmodelElementList'"
      :content="element.value as SubmodelElementCollectionResponseDto[]"
      :path="path"
    />
    <SubmodelElementCollection
      v-else-if="element.modelType === 'SubmodelElementCollection'"
      :id-short="element.idShort"
      :path="path"
    />
  </PresentationComponentRenderer>
</template>
