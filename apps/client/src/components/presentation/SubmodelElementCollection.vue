<script lang="ts" setup>
import { ChevronRightIcon } from "@heroicons/vue/16/solid";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useSubmodelTree } from "../../composables/submodel-tree";
import { usePassportStore } from "../../stores/passport";

const { idShort } = defineProps<{
  idShort: string;
}>();

const passportStore = usePassportStore();

const { getParent, submodelTree } = useSubmodelTree(passportStore.submodels);

const parentId = computed(() => {
  const parentId = getParent(submodelTree.value, idShort)?.idShort;

  return parentId || idShort;
});

const { t } = useI18n();
</script>

<template>
  <router-link
    :to="`?submodelid=${parentId}`"
    :data-cy="parentId"
    class="inline-flex items-center gap-1.5 mt-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
  >
    <span>{{ t("presentation.moreInfo") }}</span>
    <ChevronRightIcon class="size-4 shrink-0" aria-hidden="true" />
  </router-link>
</template>
