import { z } from "zod";
import { DataTypeDef } from "./common/data-type-def";
import { ModellingKind } from "./common/has-kind";
import { KeyTypes } from "./common/key";
import { Language } from "./common/language-text";
import { QualifierKind } from "./common/qualififiable";
import { ReferenceTypes } from "./common/reference";
import { AasSubmodelElements } from "./submodelBase/aas-submodel-elements";
import { EntityType } from "./submodelBase/entity";

export function nullishToOptional<T extends z.ZodType>(schema: T) {
  return schema.nullish().transform(value => value === null ? undefined : value);
}

const ValueTypeSchema = z.string().transform(
  (value) => {
    // turn "positiveInteger" → "PositiveInteger"
    let key = value;
    if (value.startsWith("xs:")) {
      const raw = value.replace(/^xs:/, "");
      key = raw.charAt(0).toUpperCase() + raw.slice(1);
    }

    // validate against enum
    if (!(key in DataTypeDef)) {
      throw new Error(`Unknown number type: ${value}`);
    }

    // return the enum value
    return z.enum(DataTypeDef).parse(key);
  },
);

export const KeyJsonSchema = z.object({
  type: z.enum(KeyTypes),
  value: z.string(),
});
export const ReferenceJsonSchema = z.object({
  type: z.enum(ReferenceTypes),
  get referredSemanticId() {
    return ReferenceJsonSchema.optional();
  },
  keys: z.array(KeyJsonSchema),
});

export const LanguageTextJsonSchema = z.object({
  language: z.enum(Language),
  text: z.string(),
});
export const QualifierJsonSchema = z.object({
  type: z.string(),
  valueType: z.enum(DataTypeDef),
  semanticId: ReferenceJsonSchema.optional(),
  supplementalSemanticIds: z.array(ReferenceJsonSchema),
  kind: z.enum(QualifierKind),
  value: z.string().optional(),
  valueId: ReferenceJsonSchema.optional(),
});
export const EmbeddedDataSpecificationJsonSchema = z.object({
  dataSpecification: ReferenceJsonSchema,
});
export const SubmodelBaseJsonSchema = z.object({
  category: nullishToOptional(z.string()),
  idShort: nullishToOptional(z.string()),
  displayName: z.array(LanguageTextJsonSchema).default([]),
  description: z.array(LanguageTextJsonSchema).default([]),
  semanticId: nullishToOptional(ReferenceJsonSchema),
  supplementalSemanticIds: z.array(ReferenceJsonSchema).default([]),
  qualifiers: z.array(QualifierJsonSchema).default([]),
  embeddedDataSpecifications: z.array(EmbeddedDataSpecificationJsonSchema).default([]),
});

export const EntityTypeJsonSchema = z.lazy(() =>
  EntityTypeJsonSchemaImpl(),
);

export const SubmodelBaseUnionSchema: z.ZodTypeAny = z.lazy(() =>
  SubmodelBaseUnionSchemaImpl(),
);

export const ExtensionJsonSchema = z.object({
  name: z.string(),
  semanticId: ReferenceJsonSchema.optional(),
  supplementalSemanticIds: z.array(ReferenceJsonSchema),
  valueType: z.enum(DataTypeDef).optional(),
  value: z.string().optional(),
  refersTo: z.array(ReferenceJsonSchema),
});
export const PropertyJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  valueType: ValueTypeSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  value: nullishToOptional(z.string()),
  valueId: nullishToOptional(ReferenceJsonSchema),
});

export const SpecificAssetIdJsonSchema = z.object({
  name: z.string(),
  value: z.string(),
  semanticId: ReferenceJsonSchema.optional(),
  supplementalSemanticIds: z.array(ReferenceJsonSchema).default([]),
  externalSubjectId: ReferenceJsonSchema.optional(),
});

export function EntityTypeJsonSchemaImpl() {
  return z.object({
    ...SubmodelBaseJsonSchema.shape,
    entityType: z.enum(EntityType),
    extensions: ExtensionJsonSchema.array().default([]),
    statements: SubmodelBaseUnionSchema.array().default([]),
    globalAssetId: nullishToOptional(z.string()),
    specificAssetIds: SpecificAssetIdJsonSchema.array().default([]),
  },
  );
}

export function SubmodelBaseUnionSchemaImpl() {
  return z.discriminatedUnion("modelType", [
    z.object({
      modelType: z.literal(KeyTypes.Property),
      ...PropertyJsonSchema.shape,
    }),
    EntityTypeJsonSchemaImpl().extend({
      modelType: z.literal(KeyTypes.Entity),
    }),
  ]);
}

export type SubmodelBaseUnion = z.infer<typeof SubmodelBaseUnionSchema>;

export const AnnotatedRelationshipElementJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  first: ReferenceJsonSchema,
  second: ReferenceJsonSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  annotations: SubmodelBaseUnionSchema.array().default([]),
});
export const BlobJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  contentType: z.string(),
  value: nullishToOptional(z.string()),
});

export const FileJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  contentType: z.string(),
  value: nullishToOptional(z.string()),
});
export const MultiLanguagePropertyJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  extensions: ExtensionJsonSchema.array().default([]),
  value: LanguageTextJsonSchema.array().default([]),
  valueId: nullishToOptional(ReferenceJsonSchema),
});

export const RangeJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  valueType: ValueTypeSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  min: nullishToOptional(z.string()),
  max: nullishToOptional(z.string()),
});
export const ReferenceElementJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  extensions: ExtensionJsonSchema.array().default([]),
  value: nullishToOptional(ReferenceJsonSchema),
});
export const RelationshipElementJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  first: ReferenceJsonSchema,
  second: ReferenceJsonSchema,
  extensions: ExtensionJsonSchema.array().default([]),
});
export const AdministrativeInformationJsonSchema = z.object({
  version: z.string(),
  revision: z.string(),
});
export const SubmodelJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  id: z.string(),
  extensions: ExtensionJsonSchema.array().default([]),
  administration: AdministrativeInformationJsonSchema,
  kind: nullishToOptional(z.enum(ModellingKind)),
  submodelElements: SubmodelBaseUnionSchema.array().default([]),
});
export const SubmodelElementCollectionJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  extensions: ExtensionJsonSchema.array().default([]),
  value: SubmodelBaseUnionSchema.array().default([]),
});
export const SubmodelElementListJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  typeValueListElement: z.enum(AasSubmodelElements),
  extensions: ExtensionJsonSchema.array().default([]),
  orderRelevant: nullishToOptional(z.boolean()),
  semanticIdListElement: nullishToOptional(ReferenceJsonSchema),
  valueTypeListElement: nullishToOptional(ValueTypeSchema),
  value: SubmodelBaseUnionSchema.array().default([]),
});
