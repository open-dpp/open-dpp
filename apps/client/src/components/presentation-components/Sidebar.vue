<script lang="ts" setup>
import type { DataSectionDto } from "@open-dpp/api-client";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useProductPassportStore } from "../../stores/product-passport";

const route = useRoute();

// Access query parameters

const productPassportStore = useProductPassportStore();
const dataSectionsToShow = ref<DataSectionDto[]>();
const rowIndex = ref(0);
const section = ref<DataSectionDto | undefined>(undefined);

watch(
  [
    () => route.query.sectionId,
    () => route.query.row,
    () => productPassportStore.productPassport?.id,
  ], // The store property to watch
  ([newSectionId, newRowIndex]) => {
    section.value = newSectionId
      ? productPassportStore.findSection(String(newSectionId))
      : undefined;
    rowIndex.value = newRowIndex ? Number(newRowIndex) : 0;

    dataSectionsToShow.value = productPassportStore.productPassport
      ? productPassportStore.productPassport.dataSections.filter(
          dataSection => dataSection.parentId === section.value?.id,
        )
      : [];
  },
  { immediate: true },
);
</script>

<template>
  <nav
    class="flex flex-1 flex-col divide-y divide-gray-200"
    aria-label="Sidebar"
  >
    <div class="font-bold py-3 text-xl">
      Navigation
    </div>
    <ul role="list" class="-mx-2 space-y-1 pt-2">
      <li v-if="section" key="back">
        <router-link
          :to="
            section.parentId
              ? `?sectionId=${section.parentId}&row=${rowIndex}&parentSectionId=${section.parentId}`
              : ''
          "
          class="text-gray-700 hover:bg-gray-50 hover:text-indigo-600 group flex gap-x-3 rounded-md p-2 pl-3 text-sm/6 font-semibold"
        >
          Zurück
        </router-link>
      </li>
      <li
        v-for="dataSectionToShow in dataSectionsToShow"
        :key="dataSectionToShow.id"
      >
        <router-link
          :to="`?sectionId=${dataSectionToShow.id}&row=${rowIndex}&parentSectionId=${dataSectionToShow.parentId}`"
          class="text-gray-700 hover:bg-gray-50 hover:text-indigo-600 group flex gap-x-3 rounded-md p-2 pl-3 text-sm/6 font-semibold"
        >
          {{ dataSectionToShow.name }}
        </router-link>
      </li>
    </ul>
  </nav>
</template>
