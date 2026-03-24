import type { TreeNode } from "primevue/treenode";
import type { DisplayName } from "./display-name";
import type { SubmodelTreeElement } from "./submodel-tree";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

function resolveDisplayName(
  options: DisplayName[],
  locale: string,
  fallback: string,
): string {
  const shortLocale = locale.split("-")[0];

  let option = options.find(opt => opt.language === shortLocale);

  if (!option) {
    option = options.find(opt => opt.language === "en");
  }

  if (!option) {
    option = options[0];
  }

  return option ? option.text : fallback;
}

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
  submodelTree: ReturnType<typeof import("./submodel-tree").useSubmodelTree>["submodelTree"],
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
