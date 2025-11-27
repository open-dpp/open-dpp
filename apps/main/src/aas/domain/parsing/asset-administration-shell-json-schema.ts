import { z } from "zod";
import {
  AdministrativeInformationJsonSchema,
  EmbeddedDataSpecificationJsonSchema,
  ExtensionJsonSchema,
  LanguageTextJsonSchema,
  ResourceJsonSchema,
} from "./aas-json-schemas";
import { AssetInformationJsonSchema } from "./asset-information-json-schema";
import { nullishToOptional } from "./basic-json-schema";
import { ReferenceJsonSchema } from "./reference-json-schema";

export const AssetAdministrationShellJsonSchema = z.object({
  id: z.string(),
  assetInformation: AssetInformationJsonSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  category: nullishToOptional(z.string()),
  idShort: nullishToOptional(z.string()),
  displayName: LanguageTextJsonSchema.array().default([]),
  description: LanguageTextJsonSchema.array().default([]),
  administration: nullishToOptional(AdministrativeInformationJsonSchema),
  embeddedDataSpecifications: EmbeddedDataSpecificationJsonSchema.array().default([]),
  derivedFrom: nullishToOptional(ResourceJsonSchema),
  submodels: ReferenceJsonSchema.array().default([]),
});
