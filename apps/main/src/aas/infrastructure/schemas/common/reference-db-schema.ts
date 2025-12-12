import { z } from "zod";
import { ReferenceTypesEnum } from "../../../domain/common/reference";
import { KeyDbSchema } from "./key-db-schema";

export const ReferenceDbSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: ReferenceTypesEnum,
    referredSemanticId: ReferenceDbSchema.optional(),
    keys: z.array(KeyDbSchema),
  }),
);
