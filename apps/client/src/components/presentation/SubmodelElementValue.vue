<script lang="ts" setup>
import type {
  SubmodelElementCollectionResponseDto,
  SubmodelElementResponseDto,
} from "@open-dpp/dto";
import MediaFieldView from "../media/MediaFieldView.vue";
import List from "./List.vue";
import Subsection from "./SubmodelElementCollection.vue";

const { element } = defineProps<{
  element: SubmodelElementResponseDto;
}>();
</script>

<template>
  <dd
    v-if="element.modelType === 'Property'"
    class="mt-1 text-sm/6 text-gray-700 sm:mt-2"
  >
    {{ element.value }}
  </dd>
  <MediaFieldView
    v-if="element.modelType === 'File' && typeof element.value === 'string'"
    :media-id="element.value"
  />
  <List
    v-if="element.modelType === 'SubmodelElementList'"
    :content="element.value as SubmodelElementCollectionResponseDto[]"
  />
  <Subsection
    v-if="element.modelType === 'SubmodelElementCollection'"
    :id-short="element.idShort"
  />
</template>
