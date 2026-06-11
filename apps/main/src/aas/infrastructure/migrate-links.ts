import { DataTypeDef, KeyTypes, ReferenceTypes } from "@open-dpp/dto";

export function migrateSubmodelElementLinks(element: any): any {
  if (!element || typeof element !== "object") {
    return element;
  }

  // Check if it's a ReferenceElement that should be a Property (Link)
  if (
    element.modelType === KeyTypes.ReferenceElement &&
    element.value &&
    element.value.type === ReferenceTypes.ExternalReference &&
    Array.isArray(element.value.keys) &&
    element.value.keys.length === 1
  ) {
    const migrated = { ...element };
    delete migrated.value;
    return {
      ...migrated,
      modelType: KeyTypes.Property,
      valueType: DataTypeDef.AnyUri,
      value: element.value.keys[0].value,
    };
  }

  // Recurse into submodel elements if they exist (SMC or SML)
  if (element.modelType === KeyTypes.SubmodelElementCollection && Array.isArray(element.value)) {
    return {
      ...element,
      value: element.value.map(migrateSubmodelElementLinks),
    };
  }

  if (element.modelType === KeyTypes.SubmodelElementList && Array.isArray(element.value)) {
    return {
      ...element,
      value: element.value.map(migrateSubmodelElementLinks),
    };
  }

  return element;
}

export function migrateSubmodelLinks(submodel: any): any {
  if (!submodel || !Array.isArray(submodel.submodelElements)) {
    return submodel;
  }

  return {
    ...submodel,
    submodelElements: submodel.submodelElements.map(migrateSubmodelElementLinks),
  };
}
