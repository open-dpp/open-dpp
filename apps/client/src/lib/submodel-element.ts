import { AasSubmodelElements, KeyTypesEnum, type SubmodelElementResponseDto } from "@open-dpp/dto";

export const CONTAINER_MODEL_TYPES: string[] = [
  KeyTypesEnum.enum.SubmodelElementCollection,
  KeyTypesEnum.enum.SubmodelElementList,
];

export const SCALAR_LEAF_MODEL_TYPES: string[] = [
  AasSubmodelElements.Property,
  AasSubmodelElements.MultiLanguageProperty,
  AasSubmodelElements.ReferenceElement,
  AasSubmodelElements.File,
];

export function makeSubmodelElement(value: SubmodelElementResponseDto) {
  return {
    isContainer: () => CONTAINER_MODEL_TYPES.includes(value.modelType),
    isLeaf: () => SCALAR_LEAF_MODEL_TYPES.includes(value.modelType),
  };
}
