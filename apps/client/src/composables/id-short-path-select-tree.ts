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

const ContainerChildrenSchema = z.object({ value: SubmodelElementSharedSchema.array() });

export interface IdShortPathNode {
  submodelIdShort: string;
  output: string;
}

function submodelNodeKey(submodelIdShort: string): string {
  return `sm:${submodelIdShort}`;
}

function elementNodeKey(submodelIdShort: string, idShortPath: string): string {
  return `sm:${submodelIdShort}:${idShortPath}`;
}

function nodeToKey(node: IdShortPathNode): string {
  return `${node.submodelIdShort}::${node.output}`;
}

export interface UseIdShortPathSelectTreeOptions {
  /** Model types to skip entirely, whether they appear as a leaf or a container. */
  excludeModelTypes?: MaybeRefOrGetter<string[]>;
}

export function useIdShortPathSelectTree(
  submodels: MaybeRefOrGetter<SubmodelResponseDto[]>,
  options: UseIdShortPathSelectTreeOptions = {},
) {
  const { locale } = useI18n();

  const treeState = computed(() => {
    const excludedModelTypes = new Set(toValue(options.excludeModelTypes) ?? []);
    const nodesByKey = new Map<string, IdShortPathNode>();
    const keysByNode = new Map<string, string>();

    const buildElementNode = (
      submodelIdShort: string,
      parentIdShortPath: string | undefined,
      element: SubmodelElementSharedResponseDto,
    ): TreeNode | null => {
      if (excludedModelTypes.has(element.modelType)) return null;

      const idShortPath = parentIdShortPath
        ? `${parentIdShortPath}.${element.idShort}`
        : element.idShort;
      const key = elementNodeKey(submodelIdShort, idShortPath);
      const label = resolveLanguageTexts(element.displayName, locale.value, element.idShort);

      if (SCALAR_LEAF_MODEL_TYPES.includes(element.modelType)) {
        const node: IdShortPathNode = { submodelIdShort: submodelIdShort, output: idShortPath };
        nodesByKey.set(key, node);
        keysByNode.set(nodeToKey(node), key);
        return { key, label };
      }

      if (CONTAINER_MODEL_TYPES.includes(element.modelType)) {
        const children = ContainerChildrenSchema.parse(element)
          .value.map((child) => buildElementNode(submodelIdShort, idShortPath, child))
          .filter((node): node is TreeNode => node !== null);
        if (children.length === 0) return null;
        return { key, label, selectable: false, children };
      }

      return null;
    };

    const treeNodes: TreeNode[] = [];
    for (const submodel of toValue(submodels)) {
      const children = submodel.submodelElements
        .map((element) => buildElementNode(submodel.id, undefined, element))
        .filter((node): node is TreeNode => node !== null);
      if (children.length === 0) continue;

      treeNodes.push({
        key: submodelNodeKey(submodel.id),
        label: resolveLanguageTexts(submodel.displayName, locale.value, submodel.idShort),
        selectable: false,
        children,
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
