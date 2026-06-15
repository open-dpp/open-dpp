import type { TreeNode } from "primevue/treenode";
import type { ComputedRef } from "vue";
import type { SubmodelTreeElement } from "./submodel-tree";
import { computed } from "vue";
import { useDisplayName } from "./display-name";
import { useAasUtils } from "./aas-utils";
import type { LanguageTextDto } from "@open-dpp/dto";

function mapToTreeNodes(
  elements: SubmodelTreeElement[],
  parseDisplayName: (displayNames: LanguageTextDto[]) => string,
  parentId?: string,
): TreeNode[] {
  return elements.map((element) => ({
    key: element.idShort,
    label: useDisplayName(element.name).value,
    data: { parentId },
    children: mapToTreeNodes(element.children, parseDisplayName, element.idShort),
  }));
}

export function useSubmodelTreeNodes(submodelTree: ComputedRef<SubmodelTreeElement[]>) {
  const { parseDisplayName } = useAasUtils();

  const treeNodes = computed<TreeNode[]>(() =>
    mapToTreeNodes(submodelTree.value, parseDisplayName),
  );

  return { treeNodes };
}
