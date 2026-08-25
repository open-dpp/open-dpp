import { z } from "zod";
import { Cset82ComponentInputSchema, GtinInputSchema } from "./gs1/gs1-digital-link";

export const UpdateGs1UniqueProductIdentifierRequestSchema = z
  .object({
    gtin: GtinInputSchema,
    batch: Cset82ComponentInputSchema.optional(),
    serial: Cset82ComponentInputSchema.optional(),
  })
  .meta({ id: "UpdateGs1UniqueProductIdentifierRequest" });

export type UpdateGs1UniqueProductIdentifierRequest = z.infer<
  typeof UpdateGs1UniqueProductIdentifierRequestSchema
>;
