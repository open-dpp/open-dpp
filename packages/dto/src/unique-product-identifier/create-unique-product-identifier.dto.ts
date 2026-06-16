import { z } from "zod";
import { Cset82ComponentInputSchema, GtinInputSchema } from "../gs1/gs1-digital-link";

/**
 * Schema for creating a new GS1 UniqueProductIdentifier.
 *
 * GS1-only by construction — there is no `type` field because this schema
 * exclusively creates GS1 UPIs. No GS1 data attributes are included here
 * (data attributes belong to the GS1 Digital Link permalink, not the UPI).
 *
 * - `referenceId` — UUID of the passport this UPI belongs to
 * - `gtin`        — any valid GTIN length (8/12/13/14); normalized to GTIN-14
 * - `batch`       — optional batch/lot (AI `10`), CSET-82 ≤ 20 chars; blank → undefined
 * - `serial`      — optional serial (AI `21`), CSET-82 ≤ 20 chars; blank → undefined
 */
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
