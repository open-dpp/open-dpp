import { randomUUID } from "node:crypto";

export function baseElement() {
  return {
    extensions: [],
    category: null,
    displayName: [],
    description: [],
    semanticId: null,
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
  };
}

export function makeReference(value = "urn:example:ref") {
  return {
    type: "ExternalReference" as const,
    referredSemanticId: null,
    keys: [{ type: "GlobalReference" as const, value }],
  };
}

export function buildEmptyExportPayload(assetKind: "Type" | "Instance" = "Type") {
  return {
    id: randomUUID(),
    format: "open-dpp:json",
    version: "1.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    environment: {
      assetAdministrationShells: [
        {
          id: randomUUID(),
          extensions: [],
          category: null,
          idShort: "empty-shell",
          displayName: [{ language: "en", text: "Empty" }],
          description: [],
          administration: null,
          embeddedDataSpecifications: [],
          derivedFrom: null,
          submodels: [],
          assetInformation: {
            assetKind,
            globalAssetId: null,
            specificAssetIds: [],
            assetType: null,
            defaultThumbnails: [],
          },
        },
      ],
      submodels: [],
      conceptDescriptions: [],
    },
  };
}

export function buildRichExportPayload(assetKind: "Type" | "Instance" = "Type") {
  const base = baseElement();
  const ref = makeReference();
  const label = assetKind === "Type" ? "Rich Template" : "Rich Passport";
  const desc =
    assetKind === "Type"
      ? "A template with all element types"
      : "A passport with all element types";

  return {
    id: randomUUID(),
    format: "open-dpp:json",
    version: "1.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    environment: {
      assetAdministrationShells: [
        {
          id: randomUUID(),
          extensions: [],
          category: null,
          idShort: "rich-shell",
          displayName: [{ language: "en", text: label }],
          description: [{ language: "en", text: desc }],
          administration: null,
          embeddedDataSpecifications: [],
          derivedFrom: null,
          submodels: [],
          assetInformation: {
            assetKind,
            globalAssetId: null,
            specificAssetIds: [],
            assetType: null,
            defaultThumbnails: [],
          },
        },
      ],
      submodels: [
        {
          id: randomUUID(),
          extensions: [],
          category: null,
          idShort: "rich-submodel",
          displayName: [{ language: "en", text: "Rich Submodel" }],
          description: [],
          administration: null,
          kind: null,
          semanticId: null,
          supplementalSemanticIds: [],
          qualifiers: [],
          embeddedDataSpecifications: [],
          submodelElements: [
            {
              ...base,
              modelType: "Property",
              idShort: "stringProp",
              valueType: "String",
              value: "hello",
              valueId: null,
            },
            {
              ...base,
              modelType: "Property",
              idShort: "intProp",
              valueType: "Int",
              value: "42",
              valueId: null,
            },
            {
              ...base,
              modelType: "File",
              idShort: "fileElement",
              contentType: "image/png",
              value: null,
            },
            {
              ...base,
              modelType: "Blob",
              idShort: "blobElement",
              contentType: "application/octet-stream",
              value: "SGVsbG8=",
            },
            {
              ...base,
              modelType: "Range",
              idShort: "rangeElement",
              valueType: "Double",
              min: "0.0",
              max: "100.0",
            },
            {
              ...base,
              modelType: "MultiLanguageProperty",
              idShort: "mlProp",
              value: [
                { language: "en", text: "English" },
                { language: "de", text: "Deutsch" },
              ],
              valueId: null,
            },
            { ...base, modelType: "ReferenceElement", idShort: "refElement", value: ref },
            {
              ...base,
              modelType: "RelationshipElement",
              idShort: "relElement",
              first: ref,
              second: ref,
            },
            {
              ...base,
              modelType: "AnnotatedRelationshipElement",
              idShort: "annotatedRelElement",
              first: ref,
              second: ref,
              annotations: [
                {
                  ...base,
                  modelType: "Property",
                  idShort: "annotProp",
                  valueType: "String",
                  value: "annotation-value",
                  valueId: null,
                },
              ],
            },
            {
              ...base,
              modelType: "Entity",
              idShort: "entityElement",
              entityType: "SelfManagedEntity",
              statements: [
                {
                  ...base,
                  modelType: "Property",
                  idShort: "statementProp",
                  valueType: "String",
                  value: "statement-value",
                  valueId: null,
                },
              ],
              globalAssetId: null,
              specificAssetIds: [],
            },
            {
              ...base,
              modelType: "SubmodelElementCollection",
              idShort: "collection",
              value: [
                {
                  ...base,
                  modelType: "Property",
                  idShort: "nestedProp",
                  valueType: "Boolean",
                  value: "true",
                  valueId: null,
                },
              ],
            },
            {
              ...base,
              modelType: "SubmodelElementList",
              idShort: "list",
              orderRelevant: true,
              semanticIdListElement: null,
              valueTypeListElement: "String",
              typeValueListElement: "Property",
              value: [
                {
                  ...base,
                  modelType: "Property",
                  idShort: "listItem1",
                  valueType: "String",
                  value: "item-1",
                  valueId: null,
                },
                {
                  ...base,
                  modelType: "Property",
                  idShort: "listItem2",
                  valueType: "String",
                  value: "item-2",
                  valueId: null,
                },
              ],
            },
          ],
        },
      ],
      conceptDescriptions: [
        {
          extensions: [],
          category: null,
          idShort: "conceptDesc1",
          displayName: [{ language: "en", text: "Test Concept" }],
          description: [{ language: "en", text: "A test concept description" }],
          semanticId: null,
          administration: null,
          embeddedDataSpecifications: [],
          isCaseOf: [ref],
        },
      ],
    },
  };
}
