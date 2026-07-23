import type {
  LanguageTextDto,
  SubmodelElementSharedResponseDto,
  SubmodelResponseDto,
} from "@open-dpp/dto";
import { AasSubmodelElements, SubmodelElementSharedSchema } from "@open-dpp/dto";
import { computed } from "vue";
import { z } from "zod";

/** v1 scope: only scalar leaf fields can be mapped, not lists/tables. */
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

export interface BulkImportMappingTarget {
  submodelId: string;
  idShortPath: string;
  idShort: string;
  displayName: LanguageTextDto[];
  modelType: string;
}

export function useBulkImportMappingTree(submodels: SubmodelResponseDto[]) {
  const targets = computed<BulkImportMappingTarget[]>(() => {
    const result: BulkImportMappingTarget[] = [];

    const visit = (
      submodelId: string,
      parentIdShortPath: string | undefined,
      elements: SubmodelElementSharedResponseDto[],
    ): void => {
      for (const element of elements) {
        const idShortPath = parentIdShortPath
          ? `${parentIdShortPath}.${element.idShort}`
          : element.idShort;

        if (SCALAR_LEAF_MODEL_TYPES.includes(element.modelType)) {
          result.push({
            submodelId,
            idShortPath,
            idShort: element.idShort,
            displayName: element.displayName,
            modelType: element.modelType,
          });
        } else if (CONTAINER_MODEL_TYPES.includes(element.modelType)) {
          const children = ContainerChildrenSchema.parse(element).value;
          visit(submodelId, idShortPath, children);
        }
      }
    };

    for (const submodel of submodels) {
      visit(submodel.id, undefined, submodel.submodelElements);
    }

    return result;
  });

  return { targets };
}
