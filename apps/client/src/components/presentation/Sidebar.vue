<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { usePassportStore } from "../../stores/passport";
import SidebarLink from "./SidebarLink.vue";
import { computed } from "vue";
import { useSubmodelTree } from "../../composables/submodel-tree";

const { t } = useI18n();

const route = useRoute();

const rootLinksActive = computed(() => {
 return !route.query.submodelid
});

const passportStore = usePassportStore();

const { submodelTree } = useSubmodelTree(passportStore.submodels);

</script>

<template>
  <nav
    class="sticky top-0 flex flex-1 flex-col divide-y divide-gray-200"
    aria-label="Sidebar"
  >
    <div class="font-bold py-3 text-xl">
      {{ t('presentation.navigation') }}
    </div>
    <ul role="list" class="-mx-2 space-y-1 pt-2">
      <SidebarLink
        v-for="element in submodelTree"
        :tree-element="element"
        :parent-active="rootLinksActive"
        :parent-id="''"
        :level="0"
      ></SidebarLink>
    </ul>
  </nav>
</template>
