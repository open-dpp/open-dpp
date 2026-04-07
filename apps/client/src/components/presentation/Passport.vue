<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useSubmodelTree } from "../../composables/submodel-tree";
import { usePassportStore } from "../../stores/passport";
import NavigationTree from "./NavigationTree.vue";
import PassportHeader from "./PassportHeader.vue";
import Submodel from "./Submodel.vue";

const { t } = useI18n();
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
  <div class="w-full py-8 flex flex-row gap-8">
    <div
      v-if="submodelTreeDepth > 1"
      class="min-w-48 hidden md:flex md:flex-col md:sticky md:top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl border border-surface-200 bg-surface-0 shadow-sm"
    >
      <h2 class="px-4 pt-4 pb-2 text-sm font-semibold text-surface-700">
        {{ t("presentation.productpass") }}
      </h2>
      <NavigationTree data-cy="sidebar" />
    </div>
    <div data-cy="content" class="flex flex-col w-full relative">
      <PassportHeader />
      <div class="mt-10 flex flex-col">
        <Submodel
          v-for="submodel in submodels"
          :key="submodel.id"
          :id-short="submodel.id"
          :title="submodel.title"
          :submodel-elements="submodel.submodelElements"
        />
      </div>
    </div>
  </div>
</template>
