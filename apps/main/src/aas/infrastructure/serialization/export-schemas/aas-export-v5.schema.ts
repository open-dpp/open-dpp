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
import { aasExportSchemaJsonV4_0 } from "./aas-export-v4.schema";

const LanguageTypeSchemaV5_0 = {
  en: "en",
  de: "de",
  "de-DE": "de-DE",
  "en-US": "en-US",
} as const;

const LanguageTextSchemaV5_0 = z.object({
  language: z.enum(LanguageTypeSchemaV5_0),
  text: z.string(),
});

let SubmodelElementSchemaV5_0: z.ZodType<any>;

const PropertySchemaV5_0 = z.object({
  ...PropertySchemaV1_0.shape,
  modelType: z.literal("Property"),
  displayName: z.array(LanguageTextSchemaV5_0),
  description: z.array(LanguageTextSchemaV5_0),
});

const SubmodelElementCollectionSchemaV5_0 = z.object({
  ...SubmodelElementCollectionSchemaV1_0.shape,
  modelType: z.literal("SubmodelElementCollection"),
  displayName: z.array(LanguageTextSchemaV5_0),
  description: z.array(LanguageTextSchemaV5_0),
  value: z.lazy(() => z.array(SubmodelElementSchemaV5_0)),
});

const SubmodelElementListSchemaV5_0 = z.object({
  ...SubmodelElementListSchemaV1_0.shape,
  modelType: z.literal("SubmodelElementList"),
  displayName: z.array(LanguageTextSchemaV5_0),
  description: z.array(LanguageTextSchemaV5_0),
  value: z.lazy(() => z.array(SubmodelElementSchemaV5_0)),
});

const BlobSchemaV5_0 = z.object({
  ...BlobSchemaV1_0.shape,
  modelType: z.literal("Blob"),
  displayName: z.array(LanguageTextSchemaV5_0),
  description: z.array(LanguageTextSchemaV5_0),
});

const FileSchemaV5_0 = z.object({
  ...FileSchemaV1_0.shape,
  modelType: z.literal("File"),
  displayName: z.array(LanguageTextSchemaV5_0),
  description: z.array(LanguageTextSchemaV5_0),
});

const MultiLanguagePropertySchemaV5_0 = z.object({
  ...MultiLanguagePropertySchemaV1_0.shape,
  modelType: z.literal("MultiLanguageProperty"),
  value: z.array(LanguageTextSchemaV5_0),
  displayName: z.array(LanguageTextSchemaV5_0),
  description: z.array(LanguageTextSchemaV5_0),
});

const RangeSchemaV5_0 = z.object({
  ...RangeSchemaV1_0.shape,
  modelType: z.literal("Range"),
  displayName: z.array(LanguageTextSchemaV5_0),
  description: z.array(LanguageTextSchemaV5_0),
});

const ReferenceElementSchemaV5_0 = z.object({
  ...ReferenceElementSchemaV1_0.shape,
  modelType: z.literal("ReferenceElement"),
  displayName: z.array(LanguageTextSchemaV5_0),
  description: z.array(LanguageTextSchemaV5_0),
});

const RelationshipElementSchemaV5_0 = z.object({
  ...RelationshipElementSchemaV1_0.shape,
  modelType: z.literal("RelationshipElement"),
  displayName: z.array(LanguageTextSchemaV5_0),
  description: z.array(LanguageTextSchemaV5_0),
});

const AnnotatedRelationshipElementSchemaV5_0 = z.object({
  ...AnnotatedRelationshipElementSchemaV1_0.shape,
  modelType: z.literal("AnnotatedRelationshipElement"),
  displayName: z.array(LanguageTextSchemaV5_0),
  description: z.array(LanguageTextSchemaV5_0),
  annotations: z.lazy(() => z.array(SubmodelElementSchemaV5_0)),
});

const EntitySchemaV4_0 = z.object({
  ...EntitySchemaV1_0.shape,
  modelType: z.literal("Entity"),
  displayName: z.array(LanguageTextSchemaV5_0),
  description: z.array(LanguageTextSchemaV5_0),
  statements: z.lazy(() => z.array(SubmodelElementSchemaV5_0)),
});


SubmodelElementSchemaV5_0 = z.lazy(() =>
  z.discriminatedUnion("modelType", [
    PropertySchemaV5_0,
    SubmodelElementCollectionSchemaV5_0,
    SubmodelElementListSchemaV5_0,
    BlobSchemaV5_0,
    FileSchemaV5_0,
    MultiLanguagePropertySchemaV5_0,
    RangeSchemaV5_0,
    ReferenceElementSchemaV5_0,
    RelationshipElementSchemaV5_0,
    AnnotatedRelationshipElementSchemaV5_0,
    EntitySchemaV4_0,
  ]),
);

export const AssetAdministrationShellV5_0 = z.object({
  ...AssetAdministrationShellV2_0.shape,
  displayName: z.array(LanguageTextSchemaV5_0),
  description: z.array(LanguageTextSchemaV5_0),
});

export const aasExportSchemaJsonV5_0 = z.object({
  ...aasExportSchemaJsonV4_0.shape,
  environment: z.object({
     ...aasExportSchemaJsonV4_0.shape.environment.shape,
     assetAdministrationShells: z.array(AssetAdministrationShellV5_0),
     submodels: z.array(
       z.object({
         ...aasExportSchemaJsonV4_0.shape.environment.shape.submodels.element.shape,
         displayName: z.array(LanguageTextSchemaV5_0),
         description: z.array(LanguageTextSchemaV5_0),
         submodelElements: z.array(SubmodelElementSchemaV5_0),
       }),
     ),
     conceptDescriptions: z.array(
       z.object({
         ...aasExportSchemaJsonV4_0.shape.environment.shape.conceptDescriptions.element.shape,
         displayName: z.array(LanguageTextSchemaV5_0),
         description: z.array(LanguageTextSchemaV5_0),
       }),
     ),
   }),
  format: z.literal(AasExportFormat["open-dpp:json"].toString()),
  version: z.literal(AasExportVersion.v5_0),
});
