<script setup lang="ts">
import type { SubmodelResponseDto } from "@open-dpp/dto";
import type { TreeNode } from "primevue/treenode";
import { computed } from "vue";
import { useIdShortPathSelectTree } from "../../composables/id-short-path-select-tree.ts";
import type { IdShortPathOption } from "../../lib/id-short-path-select.ts";

const selected = defineModel<IdShortPathOption | null>();
const props = defineProps<{
  submodels: SubmodelResponseDto[];
  excludeModelTypes?: string[];
  label?: string;
}>();

const { treeNodes, expandedKeys, resolveNode, resolveKey } = useIdShortPathSelectTree(
  () => props.submodels,
  { excludeModelTypes: () => props.excludeModelTypes ?? [] },
);

const selectionKeys = computed<Record<string, boolean>>({
  get() {
    const key = resolveKey(selected.value);
    return key ? { [key]: true } : {};
  },
  set(keys) {
    const key = Object.keys(keys).find((candidate) => keys[candidate]);
    selected.value = resolveNode(key);
  },
});

function filterBy(node: TreeNode): string {
  return `${node.label ?? ""} ${resolveNode(node.key)?.output ?? ""}`;
}
</script>

<template>
  <FloatLabel variant="on">
    <TreeSelect
      class="w-full"
      v-model="selectionKeys"
      v-model:expanded-keys="expandedKeys"
      :options="treeNodes"
      selection-mode="single"
      filter
      :data-testid="props.label"
      filter-mode="lenient"
      :filter-by="filterBy"
      :aria-label="props.label"
    />
    <label for="on_label">{{ props.label }}</label>
  </FloatLabel>
</template>
