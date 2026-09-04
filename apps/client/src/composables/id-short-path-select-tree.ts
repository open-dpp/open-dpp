import type { SubmodelResponseDto } from "@open-dpp/dto";
import type { TreeNode } from "primevue/treenode";
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  type ClassifyIdShortPathNode,
  type IdShortPathPointer,
  makeIdShortPathNode,
  SUBMODEL_MODEL_TYPE,
  type TreeBuildContext,
} from "../lib/id-short-path-select.ts";
import { SCALAR_LEAF_MODEL_TYPES, CONTAINER_MODEL_TYPES } from "../lib/submodel-element.ts";

/**
 * Convenience builder for the common "classify purely by model type" case. Every
 * concern this composable used to expose as its own option — leaf-picking,
 * container-picking, excluding types — is just a different `classify` function;
 * this builder covers the type-based ones. Anything else (permission checks,
 * excluding a specific subtree so an element can't be moved into itself, …) is a
 * few lines of custom `classify` at the call site — see this file's spec for
 * worked examples.
 */
export function classifyByModelType(config: {
  /** Defaults to the scalar leaf types (Property, MultiLanguageProperty, ReferenceElement, File). */
  selectable?: string[];
  /** Model types to drop entirely, whether they'd otherwise be a leaf or a container. */
  hidden?: string[];
}): ClassifyIdShortPathNode {
  const selectable = new Set(config.selectable ?? SCALAR_LEAF_MODEL_TYPES);
  const hidden = new Set(config.hidden ?? []);
  return (_node, modelType) => {
    if (hidden.has(modelType)) return "hidden";
    if (selectable.has(modelType)) return "selectable";
    if (CONTAINER_MODEL_TYPES.includes(modelType) || modelType === SUBMODEL_MODEL_TYPE) {
      return "visible";
    }
    return "hidden";
  };
}

const defaultClassify = classifyByModelType({});

function nodePointerToKey(pointer: IdShortPathPointer): string {
  return `${pointer.submodelIdShort}::${pointer.idShortPath}`;
}

export interface UseIdShortPathSelectTreeOptions {
  /** Defaults to picking scalar leaf fields (the original behavior). See `classifyByModelType`. */
  classify?: ClassifyIdShortPathNode;
}

export function useIdShortPathSelectTree(
  submodels: MaybeRefOrGetter<SubmodelResponseDto[]>,
  options: UseIdShortPathSelectTreeOptions = {},
) {
  const { locale } = useI18n();
  const classify = options.classify ?? defaultClassify;

  const treeState = computed(() => {
    const nodePointersByKey = new Map<string, IdShortPathPointer>();
    const keysByNodePointer = new Map<string, string>();
    const ctx: TreeBuildContext = {
      classify,
      register: (key, node) => {
        nodePointersByKey.set(key, node);
        keysByNodePointer.set(nodePointerToKey(node), key);
      },
    };

    const treeNodes = toValue(submodels)
      .map((submodel) =>
        makeIdShortPathNode({
          kind: "submodel",
          submodelIdShort: submodel.idShort,
          submodel,
        }).toTreeNode(ctx, locale.value),
      )
      .filter((node): node is TreeNode => node !== null);

    return { treeNodes, nodePointersByKey, keysByNodePointer };
  });

  const treeNodes = computed(() => treeState.value.treeNodes);

  const expandedKeys = ref<Record<string, boolean>>({});
  watch(
    treeNodes,
    (nodes) => {
      expandedKeys.value = Object.fromEntries(nodes.map((node) => [node.key, true]));
    },
    { immediate: true },
  );

  function resolveNodePointer(key: string | undefined): IdShortPathPointer | null {
    if (!key) return null;
    return treeState.value.nodePointersByKey.get(key) ?? null;
  }

  function resolveKey(target: IdShortPathPointer | null | undefined): string | null {
    if (!target) return null;
    return treeState.value.keysByNodePointer.get(nodePointerToKey(target)) ?? null;
  }

  return { treeNodes, expandedKeys, resolveNodePointer, resolveKey };
}
