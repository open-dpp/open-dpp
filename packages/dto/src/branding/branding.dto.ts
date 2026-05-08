import { z } from "zod";
import { PermalinkBaseUrlSchema } from "../shared/permalink-base-url.schema";

export const BrandingDtoSchema = z.object({
  logo: z.string().nullish(),
  primaryColor: z.string().nullish(),
  // White-label custom domain that public permalinks for this org should use.
  // `null`/absent → fall back to the per-permalink override or `OPEN_DPP_URL`.
  permalinkBaseUrl: PermalinkBaseUrlSchema.nullish(),
});

export type BrandingDto = z.infer<typeof BrandingDtoSchema>;
