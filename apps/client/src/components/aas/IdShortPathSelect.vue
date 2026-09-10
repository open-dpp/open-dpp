<script setup lang="ts">
import type { SubmodelResponseDto } from "@open-dpp/dto";
import type { TreeNode } from "primevue/treenode";
import { computed } from "vue";
import {
  classifyByModelType,
  useIdShortPathSelectTree,
} from "../../composables/id-short-path-select-tree.ts";
import type { ClassifyIdShortPathNode, IdShortPathOption } from "../../lib/id-short-path-select.ts";

const selected = defineModel<IdShortPathOption | null>();
const props = defineProps<{
  submodels: SubmodelResponseDto[];
  /** Convenience for the common case — hide these model types entirely. Ignored if `classify` is given. */
  excludeModelTypes?: string[];
  /** Full control over what's shown/selectable, for anything beyond simple type exclusion (permission checks, excluding a subtree, picking containers instead of leaves, …). */
  classify?: ClassifyIdShortPathNode;
  label?: string;
}>();

const resolvedClassify = computed(
  () => props.classify ?? classifyByModelType({ hidden: props.excludeModelTypes ?? [] }),
);

const { treeNodes, expandedKeys, resolveNodePointer, resolveKey } = useIdShortPathSelectTree(
  () => props.submodels,
  { classify: (node, modelType) => resolvedClassify.value(node, modelType) },
);

const selectionKeys = computed<Record<string, boolean>>({
  get() {
    const key = resolveKey(selected.value);
    return key ? { [key]: true } : {};
  },
  set(keys) {
    const key = Object.keys(keys).find((candidate) => keys[candidate]);
    selected.value = resolveNodePointer(key);
  },
});

function filterBy(node: TreeNode): string {
  return `${node.label ?? ""} ${resolveNodePointer(node.key)?.idShortPath ?? ""}`;
}
</script>

<template>
  <FloatLabel variant="on">
    <TreeSelect
      fluid
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
