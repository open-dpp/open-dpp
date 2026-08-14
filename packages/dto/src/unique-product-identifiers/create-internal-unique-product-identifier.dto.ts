import { z } from "zod";

export const CreateInternalUniqueProductIdentifierRequestSchema = z
  .object({
    referenceId: z.uuid(),
  })
  .meta({ id: "CreateInternalUniqueProductIdentifierRequest" });

export type CreateInternalUniqueProductIdentifierRequest = z.infer<
  typeof CreateInternalUniqueProductIdentifierRequestSchema
>;
