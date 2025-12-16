import { z } from "zod";
import { KeyTypes } from "../../../domain/common/key-types-enum";
import { AnnotatedRelationshipElementDbSchemaImpl } from "./annotated-relationship-element-db-schema";
import { BlobDbSchema } from "./blob-db-schema";
import { EntityTypeDbSchemaImpl } from "./entity-type-db-schema";
import { FileDbSchema } from "./file-db-schema";
import { MultiLanguagePropertyDbSchema } from "./multi-language-property-db-schema";
import { PropertyDbSchema } from "./property-db-schema";
import { RangeDbSchema } from "./range-db-schema";
import { ReferenceElementDbSchema } from "./reference-element-db-schema";
import { RelationshipElementDbSchema } from "./relationship-element-db-schema";
import { SubmodelElementCollectionDbSchemaImpl } from "./submodel-element-collection-db-schema";
import { SubmodelElementListDbSchemaImpl } from "./submodel-element-list-db-schema";

export const SubmodelElementDbSchema: z.ZodTypeAny = z.lazy(() =>
  SubmodelElementSchemaDbImpl(),
);

export function SubmodelElementSchemaDbImpl() {
  return z.discriminatedUnion("modelType", [
    AnnotatedRelationshipElementDbSchemaImpl().extend({
      modelType: z.literal(KeyTypes.AnnotatedRelationshipElement),
    }),
    BlobDbSchema.extend({
      modelType: z.literal(KeyTypes.Blob),
    }),
    EntityTypeDbSchemaImpl().extend({
      modelType: z.literal(KeyTypes.Entity),
    }),
    FileDbSchema.extend({
      modelType: z.literal(KeyTypes.File),
    }),
    MultiLanguagePropertyDbSchema.extend({
      modelType: z.literal(KeyTypes.MultiLanguageProperty),
    }),
    PropertyDbSchema.extend({
      modelType: z.literal(KeyTypes.Property),
    }),
    RangeDbSchema.extend({
      modelType: z.literal(KeyTypes.Range),
    }),
    ReferenceElementDbSchema.extend({
      modelType: z.literal(KeyTypes.ReferenceElement),
    }),
    RelationshipElementDbSchema.extend({
      modelType: z.literal(KeyTypes.RelationshipElement),
    }),
    SubmodelElementCollectionDbSchemaImpl().extend({
      modelType: z.literal(KeyTypes.SubmodelElementCollection),
    }),
    SubmodelElementListDbSchemaImpl().extend({
      modelType: z.literal(KeyTypes.SubmodelElementList),
    }),
  ]);
}
