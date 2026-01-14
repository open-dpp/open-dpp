import { ReferenceTypesEnum } from "@open-dpp/dto";
import { z } from "zod";
import { KeyDbSchema } from "./key-db-schema";

export const ReferenceDbSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: ReferenceTypesEnum,
    referredSemanticId: ReferenceDbSchema.nullish(),
    keys: z.array(KeyDbSchema),
  }),
);
