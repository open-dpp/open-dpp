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
    class="border-surface-200 bg-surface-0 mt-6 w-full rounded-xl border p-6 shadow-sm first:mt-0"
  >
    <h3 class="text-surface-900 border-primary-500 mb-6 border-l-3 pl-4 text-lg font-semibold">
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
