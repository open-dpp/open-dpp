<script lang="ts" setup>
import { FolderIcon } from "@heroicons/vue/16/solid";
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
    class="flex gap-2 p-2 border-2 rounded-md hover:bg-gray-50"
  >
    <div class="flex items-center">
      <FolderIcon class="size-5 shrink-0 text-gray-400" aria-hidden="true" />
    </div>
    <span>
      {{ t("presentation.moreInfo") }}
    </span>
  </router-link>
</template>
