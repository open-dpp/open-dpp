import { z } from "zod";
import { AssetInformationJsonSchema } from "../../domain/parsing/asset-information-json-schema";
import { QualifierJsonSchema } from "../../domain/parsing/common/qualifier-json-schema";
import { ReferenceJsonSchema } from "../../domain/parsing/common/reference-json-schema";
import { EmbeddedDataSpecificationJsonSchema } from "../../domain/parsing/embedded-data-specification-json-schema";
import { ExtensionJsonSchema } from "../../domain/parsing/extension-json-schema";

import { SubmodelBaseUnionSchema } from "../../domain/parsing/submodel-base/submodel-base-union-schema";

export type EmbeddedDataSpecificationDb = z.infer<typeof EmbeddedDataSpecificationJsonSchema>;
export type QualifierDb = z.infer<typeof QualifierJsonSchema>;

export type ExtensionDb = z.infer<typeof ExtensionJsonSchema>;
export type SubmodelBaseUnionDb = z.infer<typeof SubmodelBaseUnionSchema>;
export type AssetInformationDb = z.infer<typeof AssetInformationJsonSchema>;
export type ReferenceDb = z.infer<typeof ReferenceJsonSchema>;
