import { z } from "zod";
import {
  Cset82ComponentInputSchema,
  Cset82ComponentSchema,
  Gtin14Schema,
  GtinInputSchema,
} from "./gs1-digital-link";

/**
 * The persisted GS1 identity value object carried by a `GS1` UPI.
 *
 * A GTIN (stored normalized to GTIN-14) plus an optional batch (AI `10`) and/or
 * serial (AI `21`), each a CSET-82 string of at most 20 characters. Granularity
 * is implied by which keys are present: GTIN ⇒ model, +batch ⇒ batch, +serial ⇒ item.
 */
export const Gs1IdentityDtoSchema = z
  .object({
    gtin: Gtin14Schema,
    batch: Cset82ComponentSchema.nullish(),
    serial: Cset82ComponentSchema.nullish(),
  })
  .meta({ id: "Gs1Identity" });

export type Gs1IdentityDto = z.infer<typeof Gs1IdentityDtoSchema>;

/**
 * Request body to set a passport's GS1 identity. Accepts a raw GTIN of any valid
 * length (normalized to GTIN-14) and an optional batch / serial. An empty-string
 * batch/serial is treated as "clear this component".
 */
export const Gs1IdentityRequestSchema = z
  .object({
    gtin: GtinInputSchema,
    batch: Cset82ComponentInputSchema.optional(),
    serial: Cset82ComponentInputSchema.optional(),
  })
  .meta({ id: "Gs1IdentityRequest" });

export type Gs1IdentityRequest = z.input<typeof Gs1IdentityRequestSchema>;

/**
 * Response describing a passport's GS1 identity plus the server-assembled,
 * uncompressed GS1 Digital Link that a Data Carrier (QR) should encode.
 */
export const Gs1IdentityResponseSchema = z
  .object({
    uuid: z.uuid(),
    referenceId: z.uuid(),
    gtin: Gtin14Schema,
    batch: Cset82ComponentSchema.nullish(),
    serial: Cset82ComponentSchema.nullish(),
    digitalLink: z.string().url(),
  })
  .meta({ id: "Gs1IdentityResponse" });

export type Gs1IdentityResponse = z.infer<typeof Gs1IdentityResponseSchema>;
