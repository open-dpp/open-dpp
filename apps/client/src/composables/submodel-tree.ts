import type { SubmodelElementResponseDto, SubmodelResponseDto } from "@open-dpp/dto";
import type { DisplayName } from "./display-name";
import { computed, type Ref } from "vue";

export interface SubmodelTreeElement {
  idShort: string;
  name: DisplayName[];
  children: SubmodelTreeElement[];
  submodelElements: SubmodelElementResponseDto[];
}

export function useSubmodelTree(submodels: SubmodelResponseDto[]) {
  const submodelTree = computed<SubmodelTreeElement[]>(() => {
    const treeMapping = (
      submodels: SubmodelElementResponseDto[],
    ): SubmodelTreeElement[] => {
      return submodels
        .filter((element) => element.modelType === "SubmodelElementCollection")
        .map((element) => {
          const submodelElements =
            element.value as SubmodelElementResponseDto[];

          return {
            idShort: element.idShort,
            name: element.displayName,
            children: treeMapping(submodelElements),
            submodelElements: submodelElements,
          };
        });
    };

    return submodels.map((submodel) => {
      return {
        idShort: submodel.idShort,
        name: submodel.displayName,
        children: treeMapping(submodel.submodelElements),
        submodelElements: submodel.submodelElements,
      };
    });
  });

  const submodelTreeDepth = computed(() => {
    const getTreeDepth = (elements: SubmodelTreeElement[]): number => {
      if (elements.length === 0) {
        return 0;
      }

      return Math.max(
        ...elements.map((element) => 1 + getTreeDepth(element.children)),
      );
    };

    return getTreeDepth(submodelTree.value);
  });

  const mapTreeElementsToSubmodels = (elements: SubmodelTreeElement[]) => {
    return elements.map((element) => {
      return {
        id: element.idShort,
        title: element.name,
        submodelElements: element.submodelElements,
      };
    });
  };

  const findTreeElementById = (elements: SubmodelTreeElement[], id: string): SubmodelTreeElement | undefined => {
    for (const element of elements) {
      if (element.idShort === id) {
        return element;
      }

      const foundInChildren = findTreeElementById(element.children, id);
      if (foundInChildren && foundInChildren.children.length > 0) {
        return foundInChildren;
      }

      for (const submodelelement of element.submodelElements) {
        if (submodelelement.idShort === id) {
          return element
        }
      }


    }

    return undefined;
  };

  return {
    submodelTree,
    submodelTreeDepth,
    findTreeElementById,
    mapTreeElementsToSubmodels
  }
}
