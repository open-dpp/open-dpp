import { z } from "zod/v4";

export const AasExportFormat = {
  "open-dpp:json": "open-dpp:json",
} as const;

export const AasExportVersion = {
  "1.0": "1.0",
} as const;

export const DataTypeDefV1_0 = {
  AnyUri: "AnyUri",
  Base64Binary: "Base64Binary",
  Boolean: "Boolean",
  Byte: "Byte",
  Date: "Date",
  DateTime: "DateTime",
  Decimal: "Decimal",
  Double: "Double",
  Duration: "Duration",
  Float: "Float",
  GDay: "GDay",
  GMonth: "GMonth",
  GMonthDay: "GMonthDay",
  GYear: "GYear",
  GYearMonth: "GYearMonth",
  HexBinary: "HexBinary",
  Int: "Int",
  Integer: "Integer",
  Long: "Long",
  NegativeInteger: "NegativeInteger",
  NonNegativeInteger: "NonNegativeInteger",
  NonPositiveInteger: "NonPositiveInteger",
  PositiveInteger: "PositiveInteger",
  Short: "Short",
  String: "String",
  Time: "Time",
  UnsignedByte: "UnsignedByte",
  UnsignedInt: "UnsignedInt",
  UnsignedLong: "UnsignedLong",
  UnsignedShort: "UnsignedShort",
} as const;

export const KeyTypesV1_0 = {
  AnnotatedRelationshipElement: "AnnotatedRelationshipElement",
  AssetAdministrationShell: "AssetAdministrationShell",
  BasicEventElement: "BasicEventElement",
  Blob: "Blob",
  Capability: "Capability",
  ConceptDescription: "ConceptDescription",
  DataElement: "DataElement",
  Entity: "Entity",
  EventElement: "EventElement",
  File: "File",
  FragmentReference: "FragmentReference",
  GlobalReference: "GlobalReference",
  Identifiable: "Identifiable",
  MultiLanguageProperty: "MultiLanguageProperty",
  Operation: "Operation",
  Property: "Property",
  Range: "Range",
  Referable: "Referable",
  ReferenceElement: "ReferenceElement",
  RelationshipElement: "RelationshipElement",
  Submodel: "Submodel",
  SubmodelElement: "SubmodelElement",
  SubmodelElementCollection: "SubmodelElementCollection",
  SubmodelElementList: "SubmodelElementList",
} as const;

export const LanguageTypeSchemaV1_0 = {
  en: "en",
  de: "de",
} as const;

export const KeySchemaV1_0 = z.object({
  type: z.enum(KeyTypesV1_0),
  value: z.string(),
});

export const ReferenceSchemaV1_0 = z.object({
  type: z.enum(["ExternalReference", "ModelReference"]),
  get referredSemanticId() {
    return ReferenceSchemaV1_0.nullable().optional();
  },
  keys: z.array(KeySchemaV1_0),
});

export const LanguageTextSchemaV1_0 = z.object({
  language: z.enum(LanguageTypeSchemaV1_0),
  text: z.string(),
});

const ExtensionSchemaV1_0 = z.object({
  name: z.string(),
  semanticId: ReferenceSchemaV1_0.nullable(),
  supplementalSemanticIds: z.array(ReferenceSchemaV1_0),
  valueType: z.enum(DataTypeDefV1_0).nullable(),
  value: z.string().nullable(),
  refersTo: z.array(ReferenceSchemaV1_0),
});

const AdministrationSchemaV1_0 = z.object({
  version: z.string(),
  revision: z.string(),
});

const EmbeddedDataSpecificationSchemaV1_0 = z.object({
  dataSpecification: ReferenceSchemaV1_0,
});

const QualifierSchemaV1_0 = z.object({
  type: z.string(),
  valueType: z.enum(DataTypeDefV1_0).nullable(),
  semanticId: ReferenceSchemaV1_0.nullable(),
  supplementalSemanticIds: z.array(ReferenceSchemaV1_0),
  kind: z.enum(["ValueQualifier", "ConceptQualifier", "TemplateQualifier"]).nullable(),
  value: z.string().nullable(),
  valueId: ReferenceSchemaV1_0.nullable(),
});

const SubmodelElementBaseV1_0 = {
  extensions: z.array(ExtensionSchemaV1_0),
  category: z.string().nullable(),
  idShort: z.string().nullable(),
  displayName: z.array(LanguageTextSchemaV1_0),
  description: z.array(LanguageTextSchemaV1_0),
  semanticId: ReferenceSchemaV1_0.nullable().optional(),
  supplementalSemanticIds: z.array(ReferenceSchemaV1_0),
  qualifiers: z.array(QualifierSchemaV1_0),
  embeddedDataSpecifications: z.array(EmbeddedDataSpecificationSchemaV1_0),
};

let SubmodelElementSchemaV1_0: z.ZodType<any>;

const PropertySchemaV1_0 = z.object({
  ...SubmodelElementBaseV1_0,
  modelType: z.literal("Property"),
  valueType: z.enum(DataTypeDefV1_0).nullable(),
  value: z.string().nullable(),
  valueId: ReferenceSchemaV1_0.nullable().optional(),
});

const SubmodelElementCollectionSchemaV1_0 = z.object({
  ...SubmodelElementBaseV1_0,
  modelType: z.literal("SubmodelElementCollection"),
  value: z.lazy(() => z.array(SubmodelElementSchemaV1_0)),
});

const SubmodelElementListSchemaV1_0 = z.object({
  ...SubmodelElementBaseV1_0,
  modelType: z.literal("SubmodelElementList"),
  orderRelevant: z.boolean().nullable().optional(),
  semanticIdListElement: ReferenceSchemaV1_0.nullable().optional(),
  valueTypeListElement: z.enum(DataTypeDefV1_0).nullable().optional(),
  typeValueListElement: z.enum(KeyTypesV1_0).nullable().optional(),
  value: z.lazy(() => z.array(SubmodelElementSchemaV1_0)),
});

const BlobSchemaV1_0 = z.object({
  ...SubmodelElementBaseV1_0,
  modelType: z.literal("Blob"),
  contentType: z.string(),
  value: z.string().nullable(),
});

const FileSchemaV1_0 = z.object({
  ...SubmodelElementBaseV1_0,
  modelType: z.literal("File"),
  contentType: z.string(),
  value: z.string().nullable(),
});

const MultiLanguagePropertySchemaV1_0 = z.object({
  ...SubmodelElementBaseV1_0,
  modelType: z.literal("MultiLanguageProperty"),
  value: z.array(LanguageTextSchemaV1_0),
  valueId: ReferenceSchemaV1_0.nullable().optional(),
});

const RangeSchemaV1_0 = z.object({
  ...SubmodelElementBaseV1_0,
  modelType: z.literal("Range"),
  valueType: z.enum(DataTypeDefV1_0),
  min: z.string().nullable(),
  max: z.string().nullable(),
});

const ReferenceElementSchemaV1_0 = z.object({
  ...SubmodelElementBaseV1_0,
  modelType: z.literal("ReferenceElement"),
  value: ReferenceSchemaV1_0.nullable().optional(),
});

const RelationshipElementSchemaV1_0 = z.object({
  ...SubmodelElementBaseV1_0,
  modelType: z.literal("RelationshipElement"),
  first: ReferenceSchemaV1_0,
  second: ReferenceSchemaV1_0,
});

const AnnotatedRelationshipElementSchemaV1_0 = z.object({
  ...SubmodelElementBaseV1_0,
  modelType: z.literal("AnnotatedRelationshipElement"),
  first: ReferenceSchemaV1_0,
  second: ReferenceSchemaV1_0,
  annotations: z.lazy(() => z.array(SubmodelElementSchemaV1_0)),
});

const EntitySchemaV1_0 = z.object({
  ...SubmodelElementBaseV1_0,
  modelType: z.literal("Entity"),
  entityType: z.string(),
  statements: z.lazy(() => z.array(SubmodelElementSchemaV1_0)),
  globalAssetId: z.string().nullable().optional(),
  specificAssetIds: z.array(z.any()).optional(),
});

SubmodelElementSchemaV1_0 = z.lazy(() =>
  z.discriminatedUnion("modelType", [
    PropertySchemaV1_0,
    SubmodelElementCollectionSchemaV1_0,
    SubmodelElementListSchemaV1_0,
    BlobSchemaV1_0,
    FileSchemaV1_0,
    MultiLanguagePropertySchemaV1_0,
    RangeSchemaV1_0,
    ReferenceElementSchemaV1_0,
    RelationshipElementSchemaV1_0,
    AnnotatedRelationshipElementSchemaV1_0,
    EntitySchemaV1_0,
  ]),
);

export const aasExportSchemaJsonV1_0 = z.object({
  id: z.string(),
  environment: z.object({
    assetAdministrationShells: z.array(z.object({
      assetInformation: z.object({
        assetKind: z.enum(["Type", "Instance"]),
        globalAssetId: z.string().nullable().optional(),
        specificAssetIds: z.array(z.object({
          name: z.string(),
          value: z.string(),
          semanticId: ReferenceSchemaV1_0.nullable(),
          supplementalSemanticIds: z.array(ReferenceSchemaV1_0),
          externalSubjectId: ReferenceSchemaV1_0.nullable(),
        })),
        assetType: z.string().nullable(),
        defaultThumbnail: z.object({
          path: z.string(),
          contentType: z.string().nullable(),
        }).nullable().optional(),
      }),
      extensions: z.array(ExtensionSchemaV1_0),
      category: z.string().nullable(),
      idShort: z.string().nullable(),
      displayName: z.array(LanguageTextSchemaV1_0),
      description: z.array(LanguageTextSchemaV1_0),
      administration: AdministrationSchemaV1_0.nullable(),
      embeddedDataSpecifications: z.array(EmbeddedDataSpecificationSchemaV1_0),
      derivedFrom: ReferenceSchemaV1_0.nullable().optional(),
      submodels: z.array(ReferenceSchemaV1_0),
    })),
    submodels: z.array(z.object({
      id: z.string(),
      extensions: z.array(ExtensionSchemaV1_0),
      category: z.string().nullable(),
      idShort: z.string(),
      displayName: z.array(LanguageTextSchemaV1_0),
      description: z.array(LanguageTextSchemaV1_0),
      administration: AdministrationSchemaV1_0.nullable().optional(),
      kind: z.enum(["Template", "Instance"]).nullable(),
      semanticId: ReferenceSchemaV1_0.nullable().optional(),
      supplementalSemanticIds: z.array(ReferenceSchemaV1_0),
      qualifiers: z.array(QualifierSchemaV1_0),
      embeddedDataSpecifications: z.array(EmbeddedDataSpecificationSchemaV1_0),
      submodelElements: z.array(SubmodelElementSchemaV1_0),
    })),
    conceptDescriptions: z.array(z.object({
      extensions: z.array(ExtensionSchemaV1_0),
      category: z.string().nullable(),
      idShort: z.string().nullable(),
      displayName: z.array(LanguageTextSchemaV1_0),
      description: z.array(LanguageTextSchemaV1_0),
      semanticId: ReferenceSchemaV1_0.nullable(),
      administration: AdministrationSchemaV1_0.nullable(),
      embeddedDataSpecifications: z.array(EmbeddedDataSpecificationSchemaV1_0),
      isCaseOf: z.array(ReferenceSchemaV1_0),
    })),
  }),
  createdAt: z.codec(
    z.iso.datetime(),
    z.date(),
    {
      decode: isoString => new Date(isoString),
      encode: date => date.toISOString(),
    },
  ),
  updatedAt: z.codec(
    z.iso.datetime(),
    z.date(),
    {
      decode: isoString => new Date(isoString),
      encode: date => date.toISOString(),
    },
  ),
  format: z.literal(AasExportFormat["open-dpp:json"].toString()),
  version: z.literal(AasExportVersion["1.0"].toString()),
});

export type AasExportSchema = z.infer<typeof aasExportSchemaJsonV1_0>;
