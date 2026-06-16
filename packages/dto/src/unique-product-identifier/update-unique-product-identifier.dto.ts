import { z } from "zod";
import { Cset82ComponentInputSchema, GtinInputSchema } from "../gs1/gs1-digital-link";

/**
 * Schema for updating an existing GS1 UniqueProductIdentifier.
 *
 * Identical to the create schema but without `referenceId` — the passport
 * reference is immutable and cannot be changed after creation.
 *
 * GS1-only by construction — there is no `type` field. No GS1 data attributes
 * are included here (data attributes belong to the GS1 Digital Link permalink,
 * not the UPI).
 *
 * Replace-not-merge semantics: omitting batch or serial means "clear that
 * qualifier", matching the domain's `withGs1` behaviour.
 *
 * - `gtin`   — any valid GTIN length (8/12/13/14); normalized to GTIN-14
 * - `batch`  — optional batch/lot (AI `10`), CSET-82 ≤ 20 chars; blank → undefined
 * - `serial` — optional serial (AI `21`), CSET-82 ≤ 20 chars; blank → undefined
 */
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
