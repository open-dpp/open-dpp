import type { TreeNode } from "primevue/treenode";
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from "vue";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Arrays are treated as opaque leaves, not recursed into - array elements aren't addressable
// by a stable path from a single sample row, unlike nested objects.
function buildNode(parentPath: string | undefined, key: string, value: unknown): TreeNode | null {
  const path = parentPath ? `${parentPath}.${key}` : key;
  if (isPlainObject(value)) {
    const children = Object.entries(value)
      .map(([childKey, childValue]) => buildNode(path, childKey, childValue))
      .filter((node): node is TreeNode => node !== null);
    if (children.length === 0) return null;
    return { key: path, label: key, selectable: false, children };
  }
  return { key: path, label: key };
}

export function useJsonPathSelectTree(
  row: MaybeRefOrGetter<Record<string, unknown> | null | undefined>,
) {
  const treeNodes = computed<TreeNode[]>(() => {
    const currentRow = toValue(row);
    if (!currentRow) return [];
    return Object.entries(currentRow)
      .map(([key, value]) => buildNode(undefined, key, value))
      .filter((node): node is TreeNode => node !== null);
  });

  const expandedKeys = ref<Record<string, boolean>>({});
  watch(
    treeNodes,
    (nodes) => {
      expandedKeys.value = Object.fromEntries(nodes.map((node) => [node.key as string, true]));
    },
    { immediate: true },
  );

  return { treeNodes, expandedKeys };
}
