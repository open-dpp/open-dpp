import { z } from "zod";
import { ReferenceTypesEnum } from "../../common/reference";
import { KeyJsonSchema } from "./key-json-schema";

export const ReferenceJsonSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: ReferenceTypesEnum,
    referredSemanticId: ReferenceJsonSchema.optional(),
    keys: z.array(KeyJsonSchema),
  }),
);
