<script lang="ts" setup>
import type { TreeNode } from "primevue/treenode";
import { useRouter } from "vue-router";
import { useSubmodelTree } from "../../composables/submodel-tree";
import { useSubmodelTreeNodes } from "../../composables/submodel-tree-nodes";
import { usePassportStore } from "../../stores/passport";

const emit = defineEmits<{
  navigate: [];
}>();

const router = useRouter();
const passportStore = usePassportStore();

const { submodelTree } = useSubmodelTree(passportStore.submodels);
const { treeNodes } = useSubmodelTreeNodes(submodelTree);

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
    :value="treeNodes"
    selection-mode="single"
    class="w-full border-0!"
    @node-select="onNodeSelect"
  />
</template>
