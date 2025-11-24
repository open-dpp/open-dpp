import { Schema } from "mongoose";
import { KeyTypes } from "../../../domain/common/key";
import { AnnotatedRelationshipElementSchema } from "./annotated-relationship-element-schema";
import { BlobSchema } from "./blob.schema";
import { EntitySchema } from "./entity.schema";
import { FileSchema } from "./file.schema";
import { MultiLanguagePropertySchema } from "./multi-language-property.schema";
import { PropertySchema } from "./property.schema";
import { RangeSchema } from "./range.schema";
import { ReferenceElementSchema } from "./reference-element.schema";
import { RelationshipElementSchema } from "./relationship-element-schema";
import { SubmodelElementCollectionSchema } from "./submodel-element-collection.schema";
import { SubmodelElementListSchema } from "./submodel-element-list.schema";

const discriminatorsOfSubmodelElements = [
  {
    name: KeyTypes.AnnotatedRelationshipElement,
    schema: AnnotatedRelationshipElementSchema,
  },
  {
    name: KeyTypes.Blob,
    schema: BlobSchema,
  },
  {
    name: KeyTypes.Entity,
    schema: EntitySchema,
  },
  {
    name: KeyTypes.File,
    schema: FileSchema,
  },
  {
    name: KeyTypes.MultiLanguageProperty,
    schema: MultiLanguagePropertySchema,
  },
  {
    name: KeyTypes.Property,
    schema: PropertySchema,
  },
  {
    name: KeyTypes.Range,
    schema: RangeSchema,
  },
  {
    name: KeyTypes.ReferenceElement,
    schema: ReferenceElementSchema,
  },
  {
    name: KeyTypes.RelationshipElement,
    schema: RelationshipElementSchema,
  },
  {
    name: KeyTypes.SubmodelElementCollection,
    schema: SubmodelElementCollectionSchema,
  },
  {
    name: KeyTypes.SubmodelElementList,
    schema: SubmodelElementListSchema,
  },
];

export function registerSubmodelBaseSchemas(submodelElementsPath: Schema.Types.DocumentArray): void {
  for (const discriminator of discriminatorsOfSubmodelElements) {
    submodelElementsPath.discriminator(discriminator.name, discriminator.schema);
  }
}
