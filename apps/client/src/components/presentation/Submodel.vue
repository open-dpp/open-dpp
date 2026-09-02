<script lang="ts" setup>
import type { LanguageTextDto, SubmodelElementResponseDto } from "@open-dpp/dto";
import { useLanguageTextList } from "../../composables/language.ts";
import SubmodelElement from "./SubmodelElement.vue";

const { title, description, idShort, parentPathOverride } = defineProps<{
  title: LanguageTextDto[];
  description: LanguageTextDto[];
  idShort: string;
  parentId?: string;
  parentPathOverride?: string;
  submodelElements: SubmodelElementResponseDto[];
}>();

const { name } = useLanguageTextList(() => title);
const { name: descriptionText } = useLanguageTextList(() => description, "");
</script>

<template>
  <div
    :id="idShort"
    class="border-surface-200 bg-surface-0 mt-6 w-full rounded-xl border p-6 shadow-sm first:mt-0"
  >
    <div class="border-primary-500 mb-6 border-l-3 pl-4">
      <h3 class="text-surface-900 text-lg font-semibold">
        {{ name }}
      </h3>
      <p v-if="descriptionText" class="text-surface-500 mt-1 text-sm font-normal">
        {{ descriptionText }}
      </p>
    </div>
    <dl class="grid grid-cols-1">
      <SubmodelElement
        v-for="element in submodelElements"
        :key="element.idShort"
        :element="element"
        :parent-id="parentId"
        :parent-path="parentPathOverride ?? idShort"
      />
    </dl>
  </div>
</template>
