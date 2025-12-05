import { z } from "zod";
import { KeyTypes } from "../../common/key-types-enum";
import {
  AnnotatedRelationshipElementJsonSchemaImpl,
} from "./annotated-relationship-element-json-schema";
import { BlobJsonSchema } from "./blob-json-schema";
import { EntityTypeJsonSchemaImpl } from "./entity-type-json-schema";
import { FileJsonSchema } from "./file-json-schema";
import { MultiLanguagePropertyJsonSchema } from "./multi-language-property-json-schema";
import { PropertyJsonSchema } from "./property-json-schema";
import { RangeJsonSchema } from "./range-json-schema";
import { ReferenceElementJsonSchema } from "./reference-element-json-schema";
import { RelationshipElementJsonSchema } from "./relationship-element-json-schema";
import {
  SubmodelElementCollectionJsonSchemaImpl,
} from "./submodel-element-collection-json-schema";
import { SubmodelElementListJsonSchemaImpl } from "./submodel-element-list-json-schema";

export const SubmodelBaseUnionSchema: z.ZodTypeAny = z.lazy(() =>
  SubmodelBaseUnionSchemaImpl(),
);

export function SubmodelBaseUnionSchemaImpl() {
  return z.discriminatedUnion("modelType", [
    AnnotatedRelationshipElementJsonSchemaImpl().extend({
      modelType: z.literal(KeyTypes.AnnotatedRelationshipElement),
    }),
    BlobJsonSchema.extend({
      modelType: z.literal(KeyTypes.Blob),
    }),
    EntityTypeJsonSchemaImpl().extend({
      modelType: z.literal(KeyTypes.Entity),
    }),
    FileJsonSchema.extend({
      modelType: z.literal(KeyTypes.File),
    }),
    MultiLanguagePropertyJsonSchema.extend({
      modelType: z.literal(KeyTypes.MultiLanguageProperty),
    }),
    PropertyJsonSchema.extend({
      modelType: z.literal(KeyTypes.Property),
    }),
    RangeJsonSchema.extend({
      modelType: z.literal(KeyTypes.Range),
    }),
    ReferenceElementJsonSchema.extend({
      modelType: z.literal(KeyTypes.ReferenceElement),
    }),
    RelationshipElementJsonSchema.extend({
      modelType: z.literal(KeyTypes.RelationshipElement),
    }),
    SubmodelElementCollectionJsonSchemaImpl().extend({
      modelType: z.literal(KeyTypes.SubmodelElementCollection),
    }),
    SubmodelElementListJsonSchemaImpl().extend({
      modelType: z.literal(KeyTypes.SubmodelElementList),
    }),
  ]);
}
