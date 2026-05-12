import { z } from "zod";
import { PermalinkBaseUrlSchema } from "../shared/permalink-base-url.schema";

export const BrandingDtoSchema = z.object({
  logo: z.string().nullish(),
  primaryColor: z.string().nullish(),
  permalinkBaseUrl: PermalinkBaseUrlSchema.nullish(),
});

export type BrandingDto = z.infer<typeof BrandingDtoSchema>;
