<script lang="ts" setup>
import type { TreeNode } from "primevue/treenode";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useSubmodelTree } from "../../composables/submodel-tree";
import { useSubmodelTreeNodes } from "../../composables/submodel-tree-nodes";
import { usePassportStore } from "../../stores/passport";

const emit = defineEmits<{
  navigate: [];
}>();

const { t } = useI18n();
const router = useRouter();
const passportStore = usePassportStore();

const { submodelTree } = useSubmodelTree(passportStore.submodels);
const { treeNodes } = useSubmodelTreeNodes(submodelTree);

const allNodes = computed<TreeNode[]>(() => {
  const generalInfoNode: TreeNode = {
    key: "product-details",
    label: t("presentation.generalInformation"),
    data: {},
  };
  return [generalInfoNode, ...treeNodes.value];
});

function onNodeSelect(node: TreeNode) {
  const route = node.data?.parentId
    ? { query: { submodelid: node.data.parentId }, hash: `#${node.key}` }
    : { hash: `#${node.key}` };

  router.push(route);
  emit("navigate");
}
</script>

<template>
  <Tree
    :value="allNodes"
    selection-mode="single"
    :aria-label="t('presentation.productpass')"
    class="w-full border-0! bg-transparent!"
    :pt="{
      nodeLabel: { class: 'text-sm text-gray-600 hover:text-gray-900 transition-colors' },
      nodeContent: { class: 'rounded-lg! hover:bg-gray-100!' },
    }"
    @node-select="onNodeSelect"
  />
</template>
