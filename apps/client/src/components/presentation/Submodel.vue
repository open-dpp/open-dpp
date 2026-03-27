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
  <div :id="idShort" class="w-full overflow-hidden bg-white shadow sm:rounded-lg">
    <div class="overflow-hidden bg-white p-4 shadow-sm sm:rounded-lg">
      <div class="px-4 sm:px-0">
        <h3 class="font-extrabold text-gray-900">
          {{ name }}
        </h3>
      </div>
      <dl class="grid grid-cols-1 sm:grid-cols-2">
        <SubmodelElement
          v-for="element in submodelElements"
          :key="element.idShort"
          :element="element"
          :parent-id="parentId"
        />
      </dl>
    </div>
  </div>
</template>
