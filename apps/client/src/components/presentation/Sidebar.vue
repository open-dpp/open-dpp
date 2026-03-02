<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useSubmodelTree } from "../../composables/submodel-tree";
import { usePassportStore } from "../../stores/passport";
import SidebarLink from "./SidebarLink.vue";

const { t } = useI18n();

const passportStore = usePassportStore();

const { submodelTree } = useSubmodelTree(passportStore.submodels);
</script>

<template>
  <nav
    class="sticky top-0 flex flex-1 flex-col divide-y divide-gray-200"
    aria-label="Sidebar"
  >
    <div class="font-bold py-3 text-xl">
      {{ t("presentation.navigation") }}
    </div>
    <ul role="list" class="-mx-2 space-y-1 pt-2">
      <SidebarLink
        v-for="element in submodelTree"
        :key="element.idShort"
        :tree-element="element"
        :level="0"
      />
    </ul>
  </nav>
</template>
