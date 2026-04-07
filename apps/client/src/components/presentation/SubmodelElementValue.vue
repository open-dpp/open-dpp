<script lang="ts" setup>
import type {
  ReferenceValue,
  SubmodelElementCollectionResponseDto,
  SubmodelElementResponseDto,
} from "@open-dpp/dto";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { useI18n } from "vue-i18n";
import MediaFieldView from "../media/MediaFieldView.vue";
import List from "./List.vue";
import Reference from "./Reference.vue";
import SubmodelElementCollection from "./SubmodelElementCollection.vue";

const { element } = defineProps<{
  element: SubmodelElementResponseDto;
}>();

dayjs.extend(localizedFormat);

const { t } = useI18n();
</script>

<template>
  <div
    v-if="!element.value"
    class="mt-1 text-sm/6 font-semibold text-red-800 sm:mt-2"
  >
    {{ t("presentation.missingValue") }}
  </div>
  <dd
    v-if="element.modelType === 'Property'"
    class="mt-1 text-sm/6 text-gray-700 sm:mt-2"
  >
    <template
      v-if="element.valueType === 'Date'"
    >
      {{ dayjs(element.value as string).format('L') }}
    </template>
    <template
      v-else-if="element.valueType === 'DateTime'"
    >
      {{ dayjs(element.value as string).format('L LT') }}
    </template>
    <template
      v-else
    >
      {{ element.value }}
    </template>
  </dd>
  <Reference
    v-else-if="element.modelType === 'ReferenceElement'"
    :model="element.value as ReferenceValue"
  />
  <MediaFieldView
    v-else-if="
      element.modelType === 'File' && typeof element.value === 'string'
    "
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
