import { z } from "zod";
import {
  EmbeddedDataSpecificationJsonSchema,
  ExtensionJsonSchema,
  SubmodelBaseUnionSchema,
} from "../../domain/parsing/aas-json-schemas";
import { AssetInformationJsonSchema } from "../../domain/parsing/asset-information-json-schema";
import { QualifierJsonSchema } from "../../domain/parsing/qualifier-json-schema";
import { ReferenceJsonSchema } from "../../domain/parsing/reference-json-schema";

export type EmbeddedDataSpecificationDb = z.infer<typeof EmbeddedDataSpecificationJsonSchema>;
export type QualifierDb = z.infer<typeof QualifierJsonSchema>;

export type ExtensionDb = z.infer<typeof ExtensionJsonSchema>;
export type SubmodelBaseUnionDb = z.infer<typeof SubmodelBaseUnionSchema>;
export type AssetInformationDb = z.infer<typeof AssetInformationJsonSchema>;
export type ReferenceDb = z.infer<typeof ReferenceJsonSchema>;
