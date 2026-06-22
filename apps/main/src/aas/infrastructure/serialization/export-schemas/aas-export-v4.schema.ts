import z from "zod";
import {
  AnnotatedRelationshipElementSchemaV1_0,
  BlobSchemaV1_0,
  EntitySchemaV1_0,
  FileSchemaV1_0,
  MultiLanguagePropertySchemaV1_0,
  PropertySchemaV1_0,
  RangeSchemaV1_0,
  ReferenceElementSchemaV1_0,
  RelationshipElementSchemaV1_0,
  SubmodelElementCollectionSchemaV1_0,
  SubmodelElementListSchemaV1_0,
} from "./aas-export-v1.schema";
import { AssetAdministrationShellV2_0 } from "./aas-export-v2.schema";
import { aasExportSchemaJsonV3_0 } from "./aas-export-v3.schema";
import { AasExportFormat, AasExportVersion } from "./aas-export-shared";

const LanguageTypeSchemaV4_0 = {
  en: "en",
  de: "de",
  "de-DE": "de-DE",
  "en-US": "en-US",
} as const;

const LanguageTextSchemaV4_0 = z.object({
  language: z.enum(LanguageTypeSchemaV4_0),
  text: z.string(),
});

const PropertySchemaV4_0 = z.object({
  ...PropertySchemaV1_0.shape,
  modelType: z.literal("Property"),
  displayName: z.array(LanguageTextSchemaV4_0),
  description: z.array(LanguageTextSchemaV4_0),
});

const SubmodelElementCollectionSchemaV4_0 = z.object({
  ...SubmodelElementCollectionSchemaV1_0.shape,
  modelType: z.literal("SubmodelElementCollection"),
  displayName: z.array(LanguageTextSchemaV4_0),
  description: z.array(LanguageTextSchemaV4_0),
});

const SubmodelElementListSchemaV4_0 = z.object({
  ...SubmodelElementListSchemaV1_0.shape,
  modelType: z.literal("SubmodelElementList"),
  displayName: z.array(LanguageTextSchemaV4_0),
  description: z.array(LanguageTextSchemaV4_0),
});

const BlobSchemaV4_0 = z.object({
  ...BlobSchemaV1_0.shape,
  modelType: z.literal("Blob"),
  displayName: z.array(LanguageTextSchemaV4_0),
  description: z.array(LanguageTextSchemaV4_0),
});

const FileSchemaV4_0 = z.object({
  ...FileSchemaV1_0.shape,
  modelType: z.literal("File"),
  displayName: z.array(LanguageTextSchemaV4_0),
  description: z.array(LanguageTextSchemaV4_0),
});

const MultiLanguagePropertySchemaV4_0 = z.object({
  ...MultiLanguagePropertySchemaV1_0.shape,
  modelType: z.literal("MultiLanguageProperty"),
  displayName: z.array(LanguageTextSchemaV4_0),
  description: z.array(LanguageTextSchemaV4_0),
});

const RangeSchemaV4_0 = z.object({
  ...RangeSchemaV1_0.shape,
  modelType: z.literal("Range"),
  displayName: z.array(LanguageTextSchemaV4_0),
  description: z.array(LanguageTextSchemaV4_0),
});

const ReferenceElementSchemaV4_0 = z.object({
  ...ReferenceElementSchemaV1_0.shape,
  modelType: z.literal("ReferenceElement"),
  displayName: z.array(LanguageTextSchemaV4_0),
  description: z.array(LanguageTextSchemaV4_0),
});

const RelationshipElementSchemaV4_0 = z.object({
  ...RelationshipElementSchemaV1_0.shape,
  modelType: z.literal("RelationshipElement"),
  displayName: z.array(LanguageTextSchemaV4_0),
  description: z.array(LanguageTextSchemaV4_0),
});

const AnnotatedRelationshipElementSchemaV4_0 = z.object({
  ...AnnotatedRelationshipElementSchemaV1_0.shape,
  modelType: z.literal("AnnotatedRelationshipElement"),
  displayName: z.array(LanguageTextSchemaV4_0),
  description: z.array(LanguageTextSchemaV4_0),
});

const EntitySchemaV4_0 = z.object({
  ...EntitySchemaV1_0.shape,
  modelType: z.literal("Entity"),
  displayName: z.array(LanguageTextSchemaV4_0),
  description: z.array(LanguageTextSchemaV4_0),
});

let SubmodelElementSchemaV4_0: z.ZodType<any>;

SubmodelElementSchemaV4_0 = z.lazy(() =>
  z.discriminatedUnion("modelType", [
    PropertySchemaV4_0,
    SubmodelElementCollectionSchemaV4_0,
    SubmodelElementListSchemaV4_0,
    BlobSchemaV4_0,
    FileSchemaV4_0,
    MultiLanguagePropertySchemaV4_0,
    RangeSchemaV4_0,
    ReferenceElementSchemaV4_0,
    RelationshipElementSchemaV4_0,
    AnnotatedRelationshipElementSchemaV4_0,
    EntitySchemaV4_0,
  ]),
);

export const AssetAdministrationShellV4_0 = z.object({
  ...AssetAdministrationShellV2_0.shape,
  displayName: z.array(LanguageTextSchemaV4_0),
  description: z.array(LanguageTextSchemaV4_0),
});

export const aasExportSchemaJsonV4_0 = z.object({
  ...aasExportSchemaJsonV3_0.shape,
  environment: z.object({
     ...aasExportSchemaJsonV3_0.shape.environment.shape,
     assetAdministrationShells: z.array(AssetAdministrationShellV4_0),
     submodels: z.array(
       z.object({
         ...aasExportSchemaJsonV3_0.shape.environment.shape.submodels.element.shape,
         displayName: z.array(LanguageTextSchemaV4_0),
         description: z.array(LanguageTextSchemaV4_0),
         submodelElements: z.array(SubmodelElementSchemaV4_0),
       }),
     ),
     conceptDescriptions: z.array(
       z.object({
         ...aasExportSchemaJsonV3_0.shape.environment.shape.conceptDescriptions.element.shape,
         displayName: z.array(LanguageTextSchemaV4_0),
         description: z.array(LanguageTextSchemaV4_0),
       }),
     ),
   }),
  format: z.literal(AasExportFormat["open-dpp:json"].toString()),
  version: z.literal(AasExportVersion.v4_0),
});
