<script lang="ts" setup>
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import type { DisplayName } from "../../composables/display-name";
import { useDisplayName } from "../../composables/display-name";
import SubmodelElement from "./SubmodelElement.vue";

const { title } = defineProps<{
  title: DisplayName[];
  idShort: string;
  parentId?: string;
  submodelElements: SubmodelElementResponseDto[];
}>();

const { description: name } = useDisplayName(title);
</script>

<template>
  <div
    :id="idShort"
    class="w-full mt-6 first:mt-0 rounded-xl border border-surface-200 bg-surface-0 shadow-sm p-6"
  >
    <h3 class="text-lg font-semibold text-surface-900 border-l-3 border-primary-500 pl-4 mb-6">
      {{ name }}
    </h3>
    <dl class="grid grid-cols-1">
      <SubmodelElement
        v-for="element in submodelElements"
        :key="element.idShort"
        :element="element"
        :parent-id="parentId"
      />
    </dl>
  </div>
</template>
