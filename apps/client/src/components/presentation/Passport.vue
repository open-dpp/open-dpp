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
  <div class="flex w-full flex-row gap-8 py-8">
    <div
      v-if="submodelTreeDepth > 1"
      class="border-surface-200 bg-surface-0 hidden max-h-[calc(100vh-5rem)] min-w-48 self-start overflow-y-auto rounded-xl border shadow-sm md:sticky md:top-20 md:flex md:flex-col"
    >
      <h2 class="text-surface-700 px-4 pt-4 pb-2 text-sm font-semibold">
        {{ t("presentation.productpass") }}
      </h2>
      <NavigationTree data-cy="sidebar" />
    </div>
    <div data-cy="content" class="relative flex w-full flex-col">
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
