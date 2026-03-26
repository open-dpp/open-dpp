<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useSubmodelTree } from "../../composables/submodel-tree";
import { usePassportStore } from "../../stores/passport";
import Breadcrumbs from "./Breadcrumbs.vue";
import PassportHeader from "./PassportHeader.vue";
import Sidebar from "./Sidebar.vue";
import Submodel from "./Submodel.vue";

const passportStore = usePassportStore();
const route = useRoute();

const { submodelTree, submodelTreeDepth, mapTreeElementsToSubmodels, findTreeElementById } =
  useSubmodelTree(passportStore.submodels);

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
  <div class="my-10 flex w-full flex-row gap-10">
    <div
      v-if="submodelTreeDepth > 1"
      class="hidden max-h-[calc(100vh-5rem)] min-w-48 self-start overflow-y-auto bg-white px-6 py-4 shadow-sm md:sticky md:top-40 md:flex"
    >
      <Sidebar data-cy="sidebar" />
    </div>
    <div data-cy="content" class="relative flex w-full flex-col gap-5">
      <div class="flex px-6 md:hidden">
        <Breadcrumbs />
      </div>
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
