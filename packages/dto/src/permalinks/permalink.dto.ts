import { z } from "zod";
import { BrandingDtoSchema } from "../branding/branding.dto";
import { PassportDtoSchema } from "../passports/passport.dto";
import { PresentationConfigurationDtoSchema } from "../presentation-configurations/presentation-configuration.dto";
import { DateTimeSchema } from "../shared/digital-product-document.schemas";
import { PermalinkBaseUrlSchema } from "../shared/permalink-base-url.schema";

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
  baseUrl: PermalinkBaseUrlSchema.nullable().optional(),
});

export const PermalinkDtoSchema = z
  .object({
    id: z.uuid(),
    slug: PermalinkSlugSchema.nullable(),
    baseUrl: PermalinkBaseUrlSchema.nullish(),
    presentationConfigurationId: z.uuid(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .meta({ id: "Permalink" });

export type PermalinkDto = z.infer<typeof PermalinkDtoSchema>;

export const PermalinkFallbackBaseUrlSourceSchema = z.enum(["branding", "instance"]);
export type PermalinkFallbackBaseUrlSource = z.infer<typeof PermalinkFallbackBaseUrlSourceSchema>;

export const PermalinkPublicDtoSchema = PermalinkDtoSchema.extend({
  publicUrl: z.string().url(),
  fallbackBaseUrl: PermalinkBaseUrlSchema,
  fallbackBaseUrlSource: PermalinkFallbackBaseUrlSourceSchema,
}).meta({ id: "PermalinkPublic" });

export type PermalinkPublicDto = z.infer<typeof PermalinkPublicDtoSchema>;

export const PermalinkListDtoSchema = z.array(PermalinkPublicDtoSchema);
export type PermalinkListDto = z.infer<typeof PermalinkListDtoSchema>;

export const PermalinkMetadataDtoSchema = z.object({
  passportId: z.uuid(),
  organizationId: z.string().min(1),
  templateId: z.uuid().nullish(),
});

export type PermalinkMetadataDto = z.infer<typeof PermalinkMetadataDtoSchema>;

export const PermalinkUpdateRequestSchema = z
  .object({
    slug: PermalinkSlugSchema.nullish(),
    baseUrl: PermalinkBaseUrlSchema.nullish(),
  })
  .meta({ id: "PermalinkUpdateRequest" });

export type PermalinkUpdateRequest = z.infer<typeof PermalinkUpdateRequestSchema>;

export const PassportPermalinkBundleDtoSchema = z
  .object({
    passport: PassportDtoSchema,
    branding: BrandingDtoSchema,
    presentationConfiguration: PresentationConfigurationDtoSchema,
    publicUrl: z.string().url(),
  })
  .meta({ id: "PassportPermalinkBundle" });

export type PassportPermalinkBundleDto = z.infer<typeof PassportPermalinkBundleDtoSchema>;
