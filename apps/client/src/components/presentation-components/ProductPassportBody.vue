<script setup lang="ts">
import type { DataSectionDto } from "@open-dpp/api-client";
import { SectionType } from "@open-dpp/api-client";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";

import { useProductPassportStore } from "../../stores/product-passport";
import SectionView from "./SectionView.vue";
import TableView from "./TableView.vue";

const route = useRoute();

// Access query parameters

const productPassportStore = useProductPassportStore();
const dataSectionsToShow = ref<DataSectionDto[]>();
const rowIndex = ref(0);
const sectionId = ref<string | undefined>(undefined);

watch(
  [
    () => route.query.sectionId,
    () => route.query.row,
    () => productPassportStore.productPassport?.id,
  ], // The store property to watch
  ([newSectionId, newRowIndex]) => {
    sectionId.value = newSectionId ? String(newSectionId) : undefined;
    rowIndex.value = newRowIndex ? Number(newRowIndex) : 0;
    if (productPassportStore.productPassport) {
      dataSectionsToShow.value = sectionId.value
        ? productPassportStore.productPassport.dataSections.filter(
            dataSection => dataSection.id === sectionId.value,
          )
        : productPassportStore.productPassport.dataSections.filter(
            dataSection => dataSection.parentId === undefined,
          );
    }
    else {
      dataSectionsToShow.value = [];
    }
  },
  { immediate: true },
);
</script>

<template>
  <div
    v-for="(dataSection, index) in dataSectionsToShow"
    :key="index"
    class="overflow-hidden bg-white shadow sm:rounded-lg w-full"
  >
    <div class="overflow-hidden  bg-white shadow-sm sm:rounded-lg p-4">
      <div class="px-4 sm:px-0">
        <h3 class="text-base/7 font-semibold text-gray-900">
          {{ dataSection.name }}
        </h3>
      </div>
      <TableView
        v-if="
          dataSection.type === SectionType.REPEATABLE && sectionId === undefined
        "
        :data-section="dataSection"
      />
      <SectionView
        v-if="dataSection.type === SectionType.GROUP || sectionId !== undefined"
        :data-section="dataSection"
        :row-index="rowIndex"
      />
    </div>
  </div>
</template>
