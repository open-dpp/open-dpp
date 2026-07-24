<script setup lang="ts">
import type { TreeNode } from "primevue/treenode";
import { computed } from "vue";
import { useJsonPathSelectTree } from "../../composables/json-path-select-tree.ts";

const selected = defineModel<string | null>();
const props = defineProps<{
  row: Record<string, unknown> | null;
  placeholder?: string;
}>();

const { treeNodes, expandedKeys } = useJsonPathSelectTree(() => props.row);

const selectionKeys = computed<Record<string, boolean>>({
  get() {
    return selected.value ? { [selected.value]: true } : {};
  },
  set(keys) {
    selected.value = Object.keys(keys).find((candidate) => keys[candidate]) ?? null;
  },
});

function filterBy(node: TreeNode): string {
  return `${node.label ?? ""} ${node.key ?? ""}`;
}
</script>

<template>
  <TreeSelect
    v-model="selectionKeys"
    v-model:expanded-keys="expandedKeys"
    :options="treeNodes"
    selection-mode="single"
    filter
    filter-mode="lenient"
    :filter-by="filterBy"
    :placeholder="props.placeholder"
  />
</template>
