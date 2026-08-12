import type { SubmodelElementSharedResponseDto, SubmodelResponseDto } from "@open-dpp/dto";
import { AasSubmodelElements, SubmodelElementSharedSchema } from "@open-dpp/dto";
import type { TreeNode } from "primevue/treenode";
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import { resolveLanguageTexts } from "./language-text.ts";

const SCALAR_LEAF_MODEL_TYPES: string[] = [
  AasSubmodelElements.Property,
  AasSubmodelElements.MultiLanguageProperty,
  AasSubmodelElements.ReferenceElement,
  AasSubmodelElements.File,
];

// Both SubmodelElementCollection *and* SubmodelElementList can hold scalar leaves - unlike the
// existing tree composables (submodel-tree.ts, aas-editor.ts), which only recurse into
// SubmodelElementCollection and would silently skip fields nested inside a list/table.
const CONTAINER_MODEL_TYPES: string[] = [
  AasSubmodelElements.SubmodelElementCollection,
  AasSubmodelElements.SubmodelElementList,
];

/** Sentinel modelType passed to `classify` for the submodel root itself (a Submodel isn't a submodel element, so it has no real modelType). */
export const SUBMODEL_MODEL_TYPE = "Submodel";

const ContainerChildrenSchema = z.object({ value: SubmodelElementSharedSchema.array() });

export interface IdShortPathNode {
  submodelIdShort: string;
  idShortPath: string;
}

export type IdShortPathNodeVisibility = "hidden" | "visible" | "selectable";

/**
 * Classifies a node during tree construction:
 * - "hidden": the node and everything beneath it are dropped entirely.
 * - "visible": shown for navigation (e.g. to reach a selectable descendant), but can't itself be picked.
 * - "selectable": shown and can be picked.
 *
 * `modelType` is the element's AAS model type, or the `SUBMODEL_MODEL_TYPE` sentinel for the submodel root.
 */
export type ClassifyIdShortPathNode = (
  node: IdShortPathNode,
  modelType: string,
) => IdShortPathNodeVisibility;

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

function submodelNodeKey(submodelIdShort: string): string {
  return `sm:${submodelIdShort}`;
}

function elementNodeKey(submodelIdShort: string, idShortPath: string): string {
  return `sm:${submodelIdShort}:${idShortPath}`;
}

function nodeToKey(node: IdShortPathNode): string {
  return `${node.submodelIdShort}::${node.idShortPath}`;
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
    const nodesByKey = new Map<string, IdShortPathNode>();
    const keysByNode = new Map<string, string>();

    const registerSelectable = (key: string, node: IdShortPathNode) => {
      nodesByKey.set(key, node);
      keysByNode.set(nodeToKey(node), key);
    };

    const buildElementNode = (
      submodelIdShort: string,
      parentIdShortPath: string | undefined,
      element: SubmodelElementSharedResponseDto,
    ): TreeNode | null => {
      const idShortPath = parentIdShortPath
        ? `${parentIdShortPath}.${element.idShort}`
        : element.idShort;
      const node: IdShortPathNode = { submodelIdShort, idShortPath };
      const visibility = classify(node, element.modelType);
      if (visibility === "hidden") return null;

      const key = elementNodeKey(submodelIdShort, idShortPath);
      const label = resolveLanguageTexts(element.displayName, locale.value, element.idShort);
      const isSelectable = visibility === "selectable";

      let children: TreeNode[] | undefined;
      if (CONTAINER_MODEL_TYPES.includes(element.modelType)) {
        children = ContainerChildrenSchema.parse(element)
          .value.map((child) => buildElementNode(submodelIdShort, idShortPath, child))
          .filter((n): n is TreeNode => n !== null);
        if (!isSelectable && children.length === 0) return null;
      } else if (!isSelectable) {
        // A non-container node can never have children, so if it's not selectable
        // it's a dead end — drop it rather than clutter the tree with it.
        return null;
      }

      if (isSelectable) registerSelectable(key, node);
      return {
        key,
        label,
        ...(isSelectable ? {} : { selectable: false }),
        ...(children && children.length > 0 ? { children } : {}),
      };
    };

    const treeNodes: TreeNode[] = [];
    for (const submodel of toValue(submodels)) {
      const children = submodel.submodelElements
        .map((element) => buildElementNode(submodel.id, undefined, element))
        .filter((node): node is TreeNode => node !== null);

      const rootNode: IdShortPathNode = { submodelIdShort: submodel.id, idShortPath: "" };
      const rootVisibility = classify(rootNode, SUBMODEL_MODEL_TYPE);
      const isRootSelectable = rootVisibility === "selectable";
      if (rootVisibility === "hidden" || (children.length === 0 && !isRootSelectable)) continue;

      const key = submodelNodeKey(submodel.id);
      if (isRootSelectable) registerSelectable(key, rootNode);

      treeNodes.push({
        key,
        label: resolveLanguageTexts(submodel.displayName, locale.value, submodel.idShort),
        ...(isRootSelectable ? {} : { selectable: false }),
        ...(children.length > 0 ? { children } : {}),
      });
    }

    return { treeNodes, targetsByKey: nodesByKey, keysByTarget: keysByNode };
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

  function resolveNode(key: string | undefined): IdShortPathNode | null {
    if (!key) return null;
    return treeState.value.targetsByKey.get(key) ?? null;
  }

  function resolveKey(target: IdShortPathNode | null | undefined): string | null {
    if (!target) return null;
    return treeState.value.keysByTarget.get(nodeToKey(target)) ?? null;
  }

  return { treeNodes, expandedKeys, resolveNode, resolveKey };
}
