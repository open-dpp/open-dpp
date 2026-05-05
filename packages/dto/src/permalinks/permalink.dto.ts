import { z } from "zod";
import { DateTimeSchema } from "../shared/digital-product-document.schemas";

// Slugs that would collide with literal path segments under the public `/p`
// namespace. Whenever a new literal child route is added to PRESENTATION_PARENT
// in apps/client/src/router/routes/presentation/presentation.ts, add it here.
// A frontend unit test asserts the two stay in sync — see the router spec.
//
// Note: numeric-only slugs (e.g. "404") are already rejected by a separate
// refine, so they don't need to appear here.
export const PERMALINK_RESERVED_SLUGS: readonly string[] = ["new", "edit"];

const reservedSlugSet = new Set<string>(PERMALINK_RESERVED_SLUGS);

export const PermalinkSlugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)
  .refine((slug) => !/^\d+$/.test(slug), { error: "Slug cannot be numeric-only" })
  .refine((slug) => !reservedSlugSet.has(slug), { error: "Slug is reserved" });

export type PermalinkSlug = z.infer<typeof PermalinkSlugSchema>;

export const PermalinkSchema = z.union([z.uuid(), PermalinkSlugSchema]);

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

// Request body for PATCH /p/:id/slug — `slug: null` clears an existing slug.
export const PermalinkSlugUpdateRequestSchema = z
  .object({ slug: PermalinkSlugSchema.nullable() })
  .meta({ id: "PermalinkSlugUpdateRequest" });

export type PermalinkSlugUpdateRequest = z.infer<typeof PermalinkSlugUpdateRequestSchema>;
