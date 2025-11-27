import { Schema } from "mongoose";
import { KeyTypes } from "../../../domain/common/key";
import { EntitySchema } from "./entity.schema";
import { PropertySchema } from "./property.schema";

// const discriminatorsOfSubmodelElements = [
//   {
//     name: KeyTypes.AnnotatedRelationshipElement,
//     schema: AnnotatedRelationshipElementSchema,
//   },
//   {
//     name: KeyTypes.Blob,
//     schema: BlobSchema,
//   },
//   {
//     name: KeyTypes.Entity,
//     schema: EntitySchema,
//   },
//   {
//     name: KeyTypes.File,
//     schema: FileSchema,
//   },
//   {
//     name: KeyTypes.MultiLanguageProperty,
//     schema: MultiLanguagePropertySchema,
//   },
//   {
//     name: KeyTypes.Property,
//     schema: PropertySchema,
//   },
//   {
//     name: KeyTypes.Range,
//     schema: RangeSchema,
//   },
//   {
//     name: KeyTypes.ReferenceElement,
//     schema: ReferenceElementSchema,
//   },
//   {
//     name: KeyTypes.RelationshipElement,
//     schema: RelationshipElementSchema,
//   },
//   {
//     name: KeyTypes.SubmodelElementCollection,
//     schema: SubmodelElementCollectionSchema,
//   },
//   {
//     name: KeyTypes.SubmodelElementList,
//     schema: SubmodelElementListSchema,
//   },
// ];

export function registerSubmodelElementSchemas(submodelElementsPath: Schema.Types.DocumentArray): void {
  // for (const [discriminator, schema] of mongooseSubmodelSchemaRegistry.entries()) {
  //   submodelElementsPath.discriminator(discriminator, schema);
  // }
  submodelElementsPath.discriminator(KeyTypes.Entity, EntitySchema);
  submodelElementsPath.discriminator(KeyTypes.Property, PropertySchema);
}

export function registerSubmodelSchema(submodelElementsPath: Schema.Types.DocumentArray) {
  // 1. Register discriminators on submodelElements
  registerSubmodelElementSchemas(submodelElementsPath);

  // 2. Now get the *runtime* clone for Entity
  const runtimeEntitySchema
    = (submodelElementsPath as any).schema.discriminators?.[KeyTypes.Entity];

  if (!runtimeEntitySchema) {
    throw new Error("Runtime Entity discriminator schema not found.");
  }

  // 3. Now get the statements path FROM THE RUNTIME SCHEMA
  const statementsPath = runtimeEntitySchema.path("statements");

  if (statementsPath) {
    console.log("Registering statements path");
    registerSubmodelElementSchemas(statementsPath as Schema.Types.DocumentArray);
  }
}

// export function registerSubmodelBaseSchemas(submodelElementBaseSchema: Schema): void {
//   for (const discriminator of discriminatorsOfSubmodelElements) {
//     submodelElementBaseSchema.discriminator(discriminator.name, discriminator.schema);
//   }
// }
