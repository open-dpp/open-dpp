import { z } from "zod";
import { emptyArrayAsUndefinedCodec } from "../common/empty-array-as-undefined-codec";
import { LanguageTextDbSchema } from "../common/language-text-db-schema";
import { QualifierDbSchema } from "../common/qualifier-db-schema";
import { ReferenceDbSchema } from "../common/reference-db-schema";
import { EmbeddedDataSpecificationDbSchema } from "../embedded-data-specification-db-schema";

export const SubmodelBaseDbSchema = z.object({
  category: z.nullish(z.string()),
  idShort: z.string(),
  displayName: emptyArrayAsUndefinedCodec(LanguageTextDbSchema),
  description: emptyArrayAsUndefinedCodec(LanguageTextDbSchema),
  semanticId: z.nullish(ReferenceDbSchema),
  supplementalSemanticIds: emptyArrayAsUndefinedCodec(ReferenceDbSchema),
  qualifiers: emptyArrayAsUndefinedCodec(QualifierDbSchema),
  embeddedDataSpecifications: emptyArrayAsUndefinedCodec(EmbeddedDataSpecificationDbSchema),
});
