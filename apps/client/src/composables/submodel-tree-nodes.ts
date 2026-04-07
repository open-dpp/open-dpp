import type { TreeNode } from "primevue/treenode";
import type { ComputedRef } from "vue";
import type { SubmodelTreeElement } from "./submodel-tree";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { resolveDisplayName } from "./display-name";

function mapToTreeNodes(
  elements: SubmodelTreeElement[],
  locale: string,
  fallbackLabel: string,
  parentId?: string,
): TreeNode[] {
  return elements.map(element => ({
    key: element.idShort,
    label: resolveDisplayName(element.name, locale, fallbackLabel),
    data: { parentId },
    children: mapToTreeNodes(
      element.children,
      locale,
      fallbackLabel,
      element.idShort,
    ),
  }));
}

export function useSubmodelTreeNodes(
  submodelTree: ComputedRef<SubmodelTreeElement[]>,
) {
  const { locale, t } = useI18n();

  const treeNodes = computed<TreeNode[]>(() =>
    mapToTreeNodes(
      submodelTree.value,
      locale.value,
      t("common.unknownName"),
    ),
  );

  return { treeNodes };
}
