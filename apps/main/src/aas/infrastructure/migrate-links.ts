import { DataTypeDef, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { z } from "zod/v4";

export function migrateSubmodelElementLinks(element: any): any {
  if (!element || typeof element !== "object") {
    return element;
  }

  // Check if it's a ReferenceElement that should be a Property (Link)
  if (element.modelType === KeyTypes.ReferenceElement) {
    const migrated = { ...element };
    delete migrated.value;
    if (
      element.value &&
      element.value.type === ReferenceTypes.ExternalReference &&
      Array.isArray(element.value.keys) &&
      element.value.keys.length === 1
    ) {
      return {
        ...migrated,
        modelType: KeyTypes.Property,
        valueType: DataTypeDef.AnyUri,
        value: element.value.keys[0].value,
      };
    }
    if (element.value === null || element.value === undefined) {
      return {
        ...migrated,
        modelType: KeyTypes.Property,
        valueType: DataTypeDef.AnyUri,
        value: null,
      };
    }
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

export function reverseMigrateSubmodelElementLinks(element: any): any {
  if (!element || typeof element !== "object") {
    return element;
  }

  // Check if it's a Property (AnyUri) that should be a ReferenceElement
  if (element.modelType === KeyTypes.Property && element.valueType === DataTypeDef.AnyUri) {
    const migrated = { ...element };
    delete migrated.valueType;
    if (element.value !== null && element.value !== undefined) {
      return {
        ...migrated,
        modelType: KeyTypes.ReferenceElement,
        value: {
          type: ReferenceTypes.ExternalReference,
          keys: [
            {
              type: KeyTypes.GlobalReference,
              value: element.value,
            },
          ],
        },
      };
    }
    return {
      ...migrated,
      modelType: KeyTypes.ReferenceElement,
      value: null,
    };
  }

  // Recurse into submodel elements if they exist (SMC or SML)
  if (element.modelType === KeyTypes.SubmodelElementCollection && Array.isArray(element.value)) {
    return {
      ...element,
      value: element.value.map(reverseMigrateSubmodelElementLinks),
    };
  }

  if (element.modelType === KeyTypes.SubmodelElementList && Array.isArray(element.value)) {
    return {
      ...element,
      value: element.value.map(reverseMigrateSubmodelElementLinks),
    };
  }

  return element;
}

export function reverseMigrateSubmodelLinks(submodel: any): any {
  if (!submodel) {
    return submodel;
  }

  const migrated = { ...submodel };

  if (Array.isArray(submodel.submodelElements)) {
    migrated.submodelElements = submodel.submodelElements.map(reverseMigrateSubmodelElementLinks);
  }

  return migrated;
}

export function reverseMigrateLinksInValueRepresentation(valueRepr: any): any {
  if (Array.isArray(valueRepr)) {
    return valueRepr.map(reverseMigrateLinksInValueRepresentation);
  }

  if (valueRepr && typeof valueRepr === "object") {
    return Object.entries(valueRepr).reduce(
      (acc, [key, value]) => {
        acc[key] = reverseMigrateLinksInValueRepresentation(value);
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  const urlParser = z.url().safeParse(valueRepr);

  return urlParser.success
    ? {
        type: ReferenceTypes.ExternalReference,
        keys: [
          {
            type: KeyTypes.GlobalReference,
            value: valueRepr,
          },
        ],
      }
    : valueRepr;
}
