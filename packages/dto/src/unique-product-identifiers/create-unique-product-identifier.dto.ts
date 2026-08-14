import { z } from "zod";
import { Cset82ComponentInputSchema, GtinInputSchema } from "./gs1/gs1-digital-link";

export const CreateGs1UniqueProductIdentifierRequestSchema = z
  .object({
    referenceId: z.uuid(),
    gtin: GtinInputSchema,
    batch: Cset82ComponentInputSchema.optional(),
    serial: Cset82ComponentInputSchema.optional(),
  })
  .meta({ id: "CreateGs1UniqueProductIdentifierRequest" });

export type CreateGs1UniqueProductIdentifierRequest = z.infer<
  typeof CreateGs1UniqueProductIdentifierRequestSchema
>;
