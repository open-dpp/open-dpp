import { z } from "zod";
import { DateTimeSchema } from "../shared/digital-product-document.schemas";

// Reserved because the short-link router already uses these path segments; a
// slug of `new` or `edit` would collide with the app's own routes.
const RESERVED_SLUGS = new Set(["new", "edit"]);

export const PermalinkSlugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)
  .refine((slug) => !/^\d+$/.test(slug), { error: "Slug cannot be numeric-only" })
  .refine((slug) => !RESERVED_SLUGS.has(slug), { error: "Slug is reserved" });

export type PermalinkSlug = z.infer<typeof PermalinkSlugSchema>;

export const PermalinkInvariantsSchema = z.object({
  presentationConfigurationId: z.uuid(),
  slug: PermalinkSlugSchema.nullable(),
});

export const PermalinkDtoSchema = z
  .object({
    id: z.uuid(),
    slug: PermalinkSlugSchema.nullable(),
    presentationConfigurationId: z.uuid(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .meta({ id: "Permalink" });

export type PermalinkDto = z.infer<typeof PermalinkDtoSchema>;

export const PermalinkListDtoSchema = z.array(PermalinkDtoSchema);
export type PermalinkListDto = z.infer<typeof PermalinkListDtoSchema>;

export const PermalinkMetadataDtoSchema = z.object({
  passportId: z.uuid(),
  organizationId: z.string().min(1),
  templateId: z.uuid().nullish(),
});

export type PermalinkMetadataDto = z.infer<typeof PermalinkMetadataDtoSchema>;
