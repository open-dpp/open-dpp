<script setup lang="ts">
import { HomeIcon } from "@heroicons/vue/20/solid";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useDisplayName } from "../../composables/display-name";
import { useSubmodelTree } from "../../composables/submodel-tree";
import { usePassportStore } from "../../stores/passport";

const route = useRoute();

const { t } = useI18n();

const passportStore = usePassportStore();

const { submodelTree, getSubmodelTreeElementsBefore } = useSubmodelTree(
  passportStore.submodels,
);

const breadcrumbs = computed(() => {
  const submodelIdFromQuery = route.query.submodelid;
  const submodelId = Array.isArray(submodelIdFromQuery)
    ? submodelIdFromQuery[0]
    : submodelIdFromQuery;

  if (typeof submodelId !== "string" || submodelId.length === 0) {
    return [];
  }

  return getSubmodelTreeElementsBefore(submodelTree.value, submodelId);
});

function getLinkTarget(index: number) {
  const basePath = {
    path: route.path,
  };

  if (index >= 0) {
    const breadcrumbTarget = breadcrumbs.value[index];

    if (breadcrumbTarget) {
      return {
        path: route.path,
        query: {
          submodelid: breadcrumbTarget.idShort,
        },
      };
    }
  }

  return basePath;
}
</script>

<template>
  <div class="flex gap-2 justify-center items-center">
    <router-link
      class="text-gray-400 hover:text-gray-500"
      :to="{ path: route.path }"
    >
      <HomeIcon aria-hidden="true" class="h-5 w-5 shrink-0" />
      <span class="sr-only">{{ t("common.home") }}</span>
    </router-link>
    <div
      v-for="(breadcrumb, index) in breadcrumbs.slice(0, breadcrumbs.length - 1)"
      :key="breadcrumb.idShort"
      class="flex justify-center items-center gap-2"
    >
      <svg
        aria-hidden="true"
        class="w-2 h-3 shrink-0 text-gray-200"
        preserveAspectRatio="none"
        viewBox="0 0 24 44"
      >
        <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
      </svg>
      <router-link
        class="text-gray-400 hover:text-gray-500"
        :to="getLinkTarget(index - 1)"
      >
        <span>
          {{ useDisplayName(breadcrumb.name).description }}
        </span>
      </router-link>
    </div>
  </div>
</template>
