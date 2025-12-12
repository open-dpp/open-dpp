import { z } from "zod";

import { AssetInformationDbSchema } from "./asset-information-db-schema";
import { QualifierDbSchema } from "./common/qualifier-db-schema";
import { ReferenceDbSchema } from "./common/reference-db-schema";
import { EmbeddedDataSpecificationDbSchema } from "./embedded-data-specification-db-schema";
import { ExtensionDbSchema } from "./extension-db-schema";
import { SubmodelBaseUnionDbSchema } from "./submodel-base/submodel-base-union-db-schema";

export type EmbeddedDataSpecificationDb = z.infer<typeof EmbeddedDataSpecificationDbSchema>;
export type QualifierDb = z.infer<typeof QualifierDbSchema>;

export type ExtensionDb = z.infer<typeof ExtensionDbSchema>;
export type SubmodelBaseUnionDb = z.infer<typeof SubmodelBaseUnionDbSchema>;
export type AssetInformationDb = z.infer<typeof AssetInformationDbSchema>;
export type ReferenceDb = z.infer<typeof ReferenceDbSchema>;
