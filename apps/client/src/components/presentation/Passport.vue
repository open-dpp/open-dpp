<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { usePassportStore } from "../../stores/passport";
import PassportHeader from "./PassportHeader.vue";
import Sidebar from "./Sidebar.vue";
import Submodel from "./Submodel.vue";
import { useSubmodelTree } from "../../composables/submodel-tree";

const passportStore = usePassportStore();
const route = useRoute();

const {
  submodelTree,
  submodelTreeDepth,
  mapTreeElementsToSubmodels,
  findTreeElementById,
} = useSubmodelTree(passportStore.submodels);

const submodels = computed(() => {
  const submodelIdFromQuery = route.query.submodelid;
  const submodelId = Array.isArray(submodelIdFromQuery)
    ? submodelIdFromQuery[0]
    : submodelIdFromQuery;

  if (typeof submodelId !== "string" || submodelId.length === 0) {
    return mapTreeElementsToSubmodels(submodelTree.value);
  }

  const selectedElement = findTreeElementById(submodelTree.value, submodelId);

  if (!selectedElement) {
    return [];
  }

  return mapTreeElementsToSubmodels(selectedElement.children);
});
</script>

<template>
  <div class="w-full my-10 flex flex-row gap-10">
    <div
      v-if="submodelTreeDepth > 1"
      class="bg-white shadow-sm px-6 py-4 min-w-48 hidden md:flex md:sticky md:top-40 self-start max-h-[calc(100vh-5rem)] overflow-y-auto"
    >
      <Sidebar data-cy="sidebar" />
    </div>
    <div data-cy="content" class="flex flex-col gap-5 w-full relative">
      <PassportHeader />
      <Submodel
        v-for="submodel in submodels"
        :key="submodel.id"
        :id-short="submodel.id"
        :title="submodel.title"
        :submodel-elements="submodel.submodelElements"
      />
    </div>
  </div>
</template>
